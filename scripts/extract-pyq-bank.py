#!/usr/bin/env python3
"""
Extract the real previous-year questions that already live in the content HTML
into a structured question bank the tracker can render and track.

WHY THIS EXISTS
The tracker had per-topic state but no access to the actual exam questions, so
"this topic has 19 PYQs" was a claim the UI could not show or let you drill
into. The questions ARE in the repo -- they are the rows of the `#modpyq`
tables in `src/content/<slug>.html`, one row per question, grouped by module
and by paper. This turns those rows into data the app can use.

WHAT IT DELIBERATELY DOES NOT DO
It never invents, paraphrases, shortens or "tidies" a question. Every `text`
field is the verbatim cell content with tags stripped and whitespace collapsed.
A question that reads slightly wrong is worse than one that is missing, because
the whole point of the page is that it is the real paper. Subjects with no
`#modpyq` section (fm, numerical) get an empty bank -- reported explicitly at
the end so their absence reads as a known gap rather than a silent zero.

Idempotent: run it twice and the output is byte-identical.

Usage:  python3 scripts/extract-pyq-bank.py [--check]
        --check  exit non-zero if regenerating would change the file
"""

from __future__ import annotations

import argparse
import html as html_mod
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTENT = ROOT / "src" / "content"
SUBJECTS_TS = ROOT / "src" / "lib" / "subjects.ts"
OUT = ROOT / "src" / "lib" / "tracker" / "pyq-bank.json"

SLUGS = ["fm", "som", "thermo", "materials", "manufacturing", "numerical"]


def clean(html: str) -> str:
    """Strip tags, unescape entities, collapse whitespace. Never alters wording."""
    text = re.sub(r"<[^>]+>", " ", html)
    # html.unescape covers &rsquo; &middot; &rarr; &nbsp; etc. The vault's
    # generated PYQ tables use several beyond the basic five.
    text = html_mod.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def subject_codes() -> dict[str, str]:
    """Pull `code:` out of the subject registry, keyed by slug."""
    src = SUBJECTS_TS.read_text()
    codes: dict[str, str] = {}
    # Each subject entry sets `slug:` and `code:`; walk the file tracking the
    # most recent slug seen and attach the next code to it.
    current = None
    for line in src.splitlines():
        m = re.search(r'slug:\s*"([a-z]+)"', line)
        if m:
            current = m.group(1)
            continue
        m = re.search(r'code:\s*"([A-Z]+\d+)"', line)
        if m and current and current not in codes:
            codes[current] = m.group(1)
    return codes


def extract_module_name(head_html: str) -> tuple[int, str]:
    """
    A module head looks like:
      <div class="modpyq-head"><span class="mchip">1</span> <strong>Stresses & Strains</strong> <span class="tag">CO-1</span> <span class="tag tag-high">19 PYQs</span></div>
    Materials/Manufacturing instead carry a sibling heading like
    `Module 2 · Diffusion & Phase Diagrams`. Handle both, and strip the
    trailing CO / PYQ-count tags so the name is just the topic.
    """
    plain = clean(head_html)
    m = re.match(r"(\d+)\s*(.*)", plain)
    if not m:
        return 0, plain
    num = int(m.group(1))
    name = re.split(r"\s+(?:CO-?\d|Tier|End|Sem)\b", m.group(2))[0]
    name = re.sub(r"\s*\d+\s*PYQs?\s*$", "", name)
    name = re.sub(r"\s+", " ", name).strip(" ·—-")
    return num, name


def _module_heading(chunk: str) -> tuple[int, str] | None:
    """
    Find a `<h3>`/`<h4>` reading "Module 2 · Diffusion & Phase Diagrams".

    Matching is done on the CLEANED text: in the generated HTML the separator is
    the entity `&middot;`, so a raw-HTML regex looking for a literal "·" silently
    finds nothing and the module ends up named "" with number 0. That is exactly
    the bug this helper exists to prevent.
    """
    for tag in re.findall(r"<h[34][^>]*>(.*?)</h[34]>", chunk, re.S):
        text = clean(tag)
        m = re.match(r"^Module\s*(\d+)\s*[·:—-]\s*(.+)$", text)
        if m:
            return int(m.group(1)), m.group(2).strip()
    return None


def _question_rows(scope_html: str) -> list[dict]:
    """Pull question dicts out of every <tr> in a table scope."""
    out: list[dict] = []
    for row in re.findall(r"<tr[^>]*>(.*?)</tr>", scope_html, re.S):
        cells = [clean(c) for c in re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)]
        # Skip header rows and layout artefacts: keep only rows carrying text.
        if len(cells) < 2:
            continue
        if all(re.fullmatch(r"[\d.\-–/ ]*", c or " ") for c in cells):
            continue
        qno, marks, text = cells[0], None, ""
        if re.fullmatch(r"\d+", cells[1]):
            marks = int(cells[1])
            text = " ".join(cells[2:]).strip()
        else:
            text = " ".join(cells[1:]).strip()
        if not text:
            continue
        entry: dict = {"qno": qno, "text": text}
        if marks is not None:
            entry["marks"] = marks
        out.append(entry)
    return out


def _paper_from_group(pg: str) -> dict | None:
    """som/thermo shape: `.paper-group` + <h4>MID MO2022</h4> + table."""
    title = re.search(r"<h4>(.*?)</h4>", pg, re.S)
    if not title:
        return None
    title_text = clean(title.group(1))
    tm = re.search(r"\b(MID|END)\b", title_text)
    paper = title_text.replace(tm.group(1), "").strip(" ·—-") if tm else title_text
    questions = _question_rows(pg)
    if not questions:
        return None
    entry: dict = {"paper": paper or title_text, "questions": questions}
    if tm:
        entry["type"] = tm.group(1)
    thumb = re.search(r'data-zoom="/api/file\?path=([^"]+)"', pg)
    if thumb:
        entry["scanPath"] = thumb.group(1)
    return entry


def _paper_from_flat_card(chunk: str) -> dict | None:
    """
    materials/manufacturing shape: one table directly inside the card, with the
    paper label embedded in each row's first cell, e.g. "END MO25 · Q1" or
    "MID * MO25 · Q1" (the asterisk marks a topic-inferred module tag).
    Rows are grouped by the paper label so each paper stays its own group.
    """
    rows = _question_rows(chunk)
    if not rows:
        return None

    # Labels look like "END MO25 · Q1", "MID * MO23 · Q2", "SP23 · Q1".
    # The asterisk marks a module tag inferred by keyword rather than by BIT's
    # verified Qn -> Module n convention.
    label_re = re.compile(
        r"^(?P<type>MID|END)?\s*(?P<star>\*)?\s*"
        r"(?P<paper>(?:MO|SP)\d{2,4})?\s*[·:]?\s*(?P<tail>.+)$"
    )
    grouped: dict[str, dict] = {}
    order: list[str] = []
    for r in rows:
        qno = r["qno"]
        m = label_re.match(qno)
        if not m:
            if "Unlabelled" not in grouped:
                grouped["Unlabelled"] = {"questions": []}
                order.append("Unlabelled")
            grouped["Unlabelled"]["questions"].append(r)
            continue
        ptype = m.group("type") or ""
        star = bool(m.group("star"))
        paper = m.group("paper") or ""
        tail = m.group("tail").strip() or qno
        key = " ".join(x for x in (ptype, paper) if x) or "Unlabelled"
        if key not in grouped:
            grouped[key] = {"type": ptype, "inferred": False, "questions": []}
            order.append(key)
        if star:
            grouped[key]["inferred"] = True
        # Keep the number the row actually used, minus the paper label, so it
        # reads "Q1" rather than "END MO25 · Q1".
        r["qno"] = tail
        grouped[key]["questions"].append(r)

    papers: list[dict] = []
    thumb = re.search(r'data-zoom="/api/file\?path=([^"]+)"', chunk)
    for key in order:
        g = grouped[key]
        entry: dict = {"paper": key, "questions": g["questions"]}
        if g.get("type"):
            entry["type"] = g["type"]
        if g.get("inferred"):
            entry["moduleTagInferred"] = True
        if thumb:
            entry["scanPath"] = thumb.group(1)
        papers.append(entry)
    return {"__papers__": papers}


def extract(slug: str, code: str) -> dict:
    path = CONTENT / f"{slug}.html"
    if not path.exists():
        return {"code": code, "modules": [], "note": f"{slug}.html missing"}
    html = path.read_text(errors="ignore")

    sec = re.search(r'<section[^>]*id="modpyq"[^>]*>(.*?)</section>', html, re.S)
    if not sec:
        return {
            "code": code,
            "modules": [],
            "note": "no #modpyq section - the notes carry no per-question PYQ table",
        }
    body = sec.group(1)

    # Split into module cards. The subject/slug and module number are only
    # available from the card head, so each card must carry its own.
    chunks = re.split(r'<div class="modpyq-card">', body)[1:]
    modules: list[dict] = []

    for chunk in chunks:
        # som/thermo name the module in `.modpyq-head`. materials/manufacturing
        # carry no head at all and instead open the card with an <h3> reading
        # "Module 2 · Diffusion & Phase Diagrams". Prefer the explicit Module
        # marker when present, because it is unambiguous.
        number, name = 0, ""
        head = re.search(r'<div class="modpyq-head">(.*?)</div>', chunk, re.S)
        # Search the CLEANED heading text, not the raw HTML: the separator is
        # the entity `&middot;`, so a raw-HTML regex for a literal "·" misses it.
        alt = _module_heading(chunk)
        if alt:
            number, name = alt
        elif head:
            number, name = extract_module_name(head.group(1))

        papers: list[dict] = []
        # som/thermo wrap each paper in a `.paper-group` with its own <h4>.
        # materials/manufacturing instead put one table directly in the card,
        # with the paper label inside each row's first cell
        # (e.g. "END MO25 · Q1"). Both shapes are handled.
        groups = re.split(r'<div class="paper-group">', chunk)[1:]
        if groups:
            for pg in groups:
                paper = _paper_from_group(pg)
                if paper:
                    papers.append(paper)
        else:
            flat = _paper_from_flat_card(chunk)
            if flat:
                papers.extend(flat["__papers__"])

        if papers:
            modules.append({"module": number, "name": name, "papers": papers})

    modules.sort(key=lambda m: m["module"])
    out = {"code": code, "modules": modules}
    if not modules:
        out["note"] = "no per-question rows parsed from #modpyq"
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true",
                    help="exit 1 if the file on disk differs from a fresh build")
    args = ap.parse_args()

    codes = subject_codes()
    bank = {slug: extract(slug, codes.get(slug, "")) for slug in SLUGS}
    payload = json.dumps(bank, indent=2, ensure_ascii=False, sort_keys=False) + "\n"

    if args.check:
        current = OUT.read_text() if OUT.exists() else ""
        if current != payload:
            print(f"DRIFT: {OUT} is stale, re-run without --check", file=sys.stderr)
            return 1
        print(f"clean: {OUT.name} matches the content HTML")
        return 0

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(payload)

    grand = 0
    for slug, data in bank.items():
        n = sum(len(p["questions"]) for m in data["modules"] for p in m["papers"])
        grand += n
        flag = "" if n else f"   <- {data.get('note', 'empty')}"
        print(f"{slug:14} code={data['code'] or '?':8} "
              f"modules={len(data['modules'])} questions={n}{flag}")
    print(f"{'TOTAL':14} questions={grand}")
    print(f"written: {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
