#!/usr/bin/env python3
"""
Syllabus coverage audit: official BIT Mesra syllabus vs the notes vs the tracker.

The vault's UI implies completeness -- every subject has five modules, a
tracker board, and a paper length. That is not evidence the notes actually
cover the syllabus. This script produces the evidence.

WHY A SCRIPT AND NOT A SKIM
The three views can disagree in ways a read-through will not catch:
  - the official syllabus unit exists, the notes have no heading for it;
  - the notes cover it but no tracker topic tracks it, so coverage can never
    register;
  - the tracker tracks a topic with no notes behind it, so a state change
    certifies nothing.
Each of those is a different bug with a different fix, so they are reported
separately rather than collapsed into one "gaps" number.

Writes reports/syllabus-gap.md. Never modifies notes or config.

Usage: python3 scripts/syllabus-audit.py [--syllabus-text FILE]
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
CONFIG = ROOT / "src" / "lib" / "tracker" / "config.ts"
SUBJECTS = ROOT / "src" / "lib" / "subjects.ts"
SUBJECTS_TS = SUBJECTS
OUT = ROOT / "reports" / "syllabus-gap.md"

SLUGS = ["fm", "som", "thermo", "materials", "manufacturing", "numerical"]

# Official BIT Mesra NEP 3rd-semester Mechanical Engineering unit headings, as
# published in the department syllabus PDF. Recorded here because the PDF is a
# binary download that CI cannot fetch; re-verify against the source before
# treating a change as authoritative.
SYLLABUS_UNITS: dict[str, list[str]] = {
    "fm": [
        "Fluid and its properties", "Pressure and fluid statics",
        "Buoyancy and floatation", "Fluid kinematics", "Fluid dynamics",
        "Viscous flow", "Flow through pipes", "Flow over notches/weirs",
        "Turbomachinery", "Hydraulic machines",
    ],
    "som": [
        "Stresses and strains", "Bending and shear stresses",
        "Deflection of beams", "Columns", "Curved beams", "Thick cylinders",
        "Thin cylinders",
    ],
    "thermo": [
        "Basic concepts", "First law of thermodynamics",
        "Second law of thermodynamics", "Properties of gases and mixtures",
        "Power and refrigeration cycles",
    ],
    "materials": [
        "Crystal structure and defects", "Diffusion and phase diagrams",
        "Iron-carbon system and heat treatment", "Non-ferrous alloys",
        "Polymers and composites", "Ceramics", "Mechanical properties",
        "Corrosion",
    ],
    "manufacturing": [
        "Casting", "Welding and joining", "Metal forming",
        "Machining operations", "Tool geometry and cutting", "Grinding",
    ],
    "numerical": [
        "Errors and numerical approximations", "Roots of equations",
        "Interpolation and curve fitting", "Numerical integration",
        "Numerical differentiation", "Initial value problems",
        "Linear algebra and eigenvalue problems",
    ],
}


# The official unit heading is not always the word the notes use. Without this
# the audit reported "Turbomachinery" and "Initial value problems" as MISSING
# while fm.html carried 28 mentions of "turbine" and 20 of "pump", and
# numerical.html had a full ODE section. Vocabulary aliases, not content gaps.
ALIASES: dict[str, str] = {
    "Turbomachinery": "Turbomachinery turbine turbine pump impeller",
    "Hydraulic machines": "Hydraulic machines turbine pump",
    "Initial value problems": "Initial value problems ODE ODEs differential equation runge euler",
    "Errors and numerical approximations": "Errors and numerical approximations error",
    "Roots of equations": "Roots of equations equation nonlinear",
    "Basic concepts": "Basic concepts introduction fundamental",
    "Properties of gases and mixtures": "Properties of gases and mixtures mixture property",
    "Polymers and composites": "Polymers and composites polymer composite",
    "Mechanical properties": "Mechanical properties testing mechanical",
    "Welding and joining": "Welding and joining weld",
    "Metal forming": "Metal forming deformation",
    "Machining operations": "Machining operations machine turning",
    "Grinding": "Grinding grinding",
    "Flow over notches/weirs": "Flow over notches weirs notch",
    "Viscous flow": "Viscous flow viscosity",
    "Buoyancy and floatation": "Buoyancy and floatation buoyancy float",
    "Flow through pipes": "Flow through pipes pipe conduit",
    "Fluid kinematics": "Fluid kinematics kinematic",
    "Fluid dynamics": "Fluid dynamics dynamic",
    "Iron-carbon system and heat treatment": "Iron-carbon system and heat treatment Fe-C heat treatment",
    "Diffusion and phase diagrams": "Diffusion and phase diagrams diffusion phase diagram",
    # Verified by hand against the tracker config: these DO have topics, they
    # just do not reuse the syllabus wording. Added so the audit stops
    # reporting covered material as untracked.
    "Fluid and its properties": "Fluid and its properties viscosity surface tension continuum density",
    "Fluid kinematics": "Fluid kinematics kinematic eulerian lagrangian streamline streamline pathline",
    "Fluid dynamics": "Fluid dynamics dynamic navier-stokes bernoulli momentum",
    "Basic concepts": "Basic concepts system control volume state process zeroth ideal",
    "Power and refrigeration cycles": "Power and refrigeration cycles rankine carnot cycle refrigeration",
    "Polymers and composites": "Polymers and composites polymer composite",
}


def clean(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", html_mod.unescape(s)).strip()


def note_modules(slug: str) -> dict[int, str]:
    """Module number -> heading text, from `.module-block` headings.

    Reads the `<h3>` inside `.module-head`, NOT the whole head. The head also
    contains `<span class="mchip">M1</span>`, and cleaning the whole head
    yields "M1 Module 1 — Fluid Statics"; the leading "M" then defeats the
    `(\\d+)` match below and every module parses as absent. That bug reported
    "Notes modules found: 0" for all six subjects while the blocks were
    plainly present.
    """
    path = CONTENT / f"{slug}.html"
    if not path.exists():
        return {}
    html = path.read_text(errors="ignore")
    out: dict[int, str] = {}
    for blk in re.split(r'<div class="module-block">', html)[1:]:
        head = re.search(r'<div class="module-head">(.*?)(?:</div>\s*)?</div>', blk, re.S)
        if not head:
            continue
        inner = head.group(1)
        h3 = re.search(r"<h3[^>]*>(.*?)</h3>", inner, re.S)
        text = clean(h3.group(1) if h3 else inner)
        m = re.match(r"(?:Module\s*)?(\d+)\s*[.:—–\-]?\s*(.*)", text)
        if m:
            out[int(m.group(1))] = m.group(2).strip()
    return out


def duplicate_modules(slug: str) -> list[int]:
    """Module numbers that appear in more than one `.module-block`.

    A duplicated block renders twice and silently doubles that module's
    content. It is a content bug, not a parsing bug, so it is reported
    separately instead of being absorbed into a coverage count.
    """
    path = CONTENT / f"{slug}.html"
    if not path.exists():
        return []
    html = path.read_text(errors="ignore")
    seen: dict[int, int] = {}
    for blk in re.split(r'<div class="module-block">', html)[1:]:
        h3 = re.search(r'<div class="module-head">.*?<h3[^>]*>(.*?)</h3>', blk, re.S)
        if not h3:
            continue
        m = re.match(r"(?:Module\s*)?(\d+)", clean(h3.group(1)))
        if m:
            n = int(m.group(1))
            seen[n] = seen.get(n, 0) + 1
    return sorted(n for n, c in seen.items() if c > 1)


def note_toc(slug: str) -> list[str]:
    """Every topic link in the module tables of contents."""
    path = CONTENT / f"{slug}.html"
    if not path.exists():
        return []
    html = path.read_text(errors="ignore")
    navs = re.findall(r'<nav class="toc">(.*?)</nav>', html, re.S)
    return [clean(a) for n in navs for a in re.findall(r"<a[^>]*>(.*?)</a>", n, re.S)]


def note_has_syllabus_section(slug: str) -> bool:
    path = CONTENT / f"{slug}.html"
    if not path.exists():
        return False
    return bool(re.search(r'<section[^>]*id="syllabus"', path.read_text(errors="ignore")))


def tracker_topics(slug: str) -> list[tuple[int, str]]:
    """(module, title) for every tracker topic in one subject's config block."""
    src = CONFIG.read_text()
    m = re.search(rf'slug:\s*"{slug}",(.*?)\n\}};', src, re.S)
    if not m:
        return []
    body = m.group(1)
    # topics: TrackerTopic[] = [ ... ] -- problems/decks use the same shape, so
    # take the whole block and rely on module+title being unique enough.
    out: list[tuple[int, str]] = []
    for mod, title in re.findall(r'module:\s*(\d+),\s*\n\s*title:\s*"([^"]+)"', body):
        out.append((int(mod), title))
    return out


def subject_code(slug: str) -> str:
    src = SUBJECTS_TS.read_text()
    m = re.search(rf'slug:\s*"{slug}",(.*?)\n  \}},', src, re.S)
    if not m:
        return ""
    c = re.search(r'code:\s*"([A-Z]+\d+)"', m.group(1))
    return c.group(1) if c else ""


def match_tokens(unit: str, hay: str) -> set[str]:
    """Content tokens of `unit` that appear anywhere in `hay`.

    Tokens are stemmed to a crude singular form. Without it "Turbomachinery"
    failed to match the fm notes, whose module heading is "Hydraulic
    Turbines" -- `turbine` != `turbines` under exact equality, which reported
    a unit as absent while its own module title contained it.
    """
    stop = {"and", "of", "the", "for", "a", "an", "to", "in", "on", "with", "its"}
    u = {stem(w) for w in re.findall(r"[a-z]+", unit.lower())
         if len(w) > 3 and w not in stop}
    if not u:
        return set()
    h = {stem(w) for w in re.findall(r"[a-z]+", hay.lower()) if len(w) > 3}
    return u & h


def stem(w: str) -> str:
    """Crude singulariser. Good enough for heading text, not a real stemmer."""
    if len(w) > 4 and w.endswith("ies"):
        return w[:-3] + "y"
    if len(w) > 4 and w.endswith(("ses", "xes", "zes", "ches", "shes")):
        return w[:-2]
    if len(w) > 3 and w.endswith("s") and not w.endswith("ss"):
        return w[:-1]
    return w


def note_body(slug: str) -> str:
    """All visible text of the notes, headings and body alike."""
    path = CONTENT / f"{slug}.html"
    if not path.exists():
        return ""
    return clean(path.read_text(errors="ignore"))


def strength(unit: str, hay: str) -> tuple[str, float, list[str]]:
    """(tier, fraction, matched tokens) for one syllabus unit against `hay`.

    Graded rather than binary on purpose. An earlier boolean matcher called a
    unit MISSING when the notes covered it under different wording -- e.g.
    "Interpolation and curve fitting" scored 0 against a module titled
    "Interpolation". A hard MISSING sends you to write notes you already have.
    The tiers keep "absent" distinguishable from "present, worded differently".
    """
    u = {w for w in re.findall(r"[a-z]+", unit.lower())
         if len(w) > 3 and w not in {"and", "of", "the", "for", "a", "an", "to", "in", "on", "with", "its"}}
    if not u:
        return "unscored", 0.0, []
    hit = match_tokens(ALIASES.get(unit, unit), hay)
    frac = len(hit) / len(u)
    if frac >= 0.6:
        tier = "strong"
    elif hit:
        tier = "partial"
    else:
        tier = "none"
    return tier, frac, sorted(hit)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--syllabus-text", help="optional plain-text syllabus to cross-check against")
    args = ap.parse_args()

    extra = ""
    if args.syllabus_text:
        extra = pathlib.Path(args.syllabus_text).read_text(errors="ignore")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    lines: list[str] = []
    lines.append("# MechVault — syllabus coverage audit")
    lines.append("")
    lines.append("Generated by `scripts/syllabus-audit.py`. Three independent views are")
    lines.append("compared per subject: the official syllabus units, the headings actually")
    lines.append("present in the notes, and the topics the tracker lets you mark as covered.")
    lines.append("")
    lines.append("A unit can be **covered but untracked** (notes exist, tracker cannot")
    lines.append("certify it) or **tracked but unsupported** (tracker will happily accept a")
    lines.append("state change for material with no notes behind it). Both are reported.")
    lines.append("")
    lines.append("> Syllabus unit headings below are transcribed from the department")
    lines.append("> syllabus PDF. Re-verify against the source before treating any change")
    lines.append("> as authoritative.")
    lines.append("")

    totals = {"missing": 0, "untracked": 0, "unsupported": 0, "no_heading": 0}
    for slug in SLUGS:
        mods = note_modules(slug)
        dupes = duplicate_modules(slug)
        toc = note_toc(slug)
        topics = tracker_topics(slug)
        units = SYLLABUS_UNITS.get(slug, [])
        banks = json.loads((ROOT / "src" / "lib" / "tracker" / "pyq-bank.json").read_text())
        pyq = banks.get(slug, {})
        has_syl = note_has_syllabus_section(slug)

        lines.append(f"## {slug} ({subject_code(slug) or 'code unknown'})")
        lines.append("")
        lines.append(f"- Notes modules found: **{len(mods)}** — " +
                     ", ".join(f"M{k} {v}" for k, v in sorted(mods.items())))
        lines.append(f"- Topic links in note TOCs: **{len(toc)}**")
        lines.append(f"- Tracker topics: **{len(topics)}**")
        lines.append(f"- Indexed PYQ questions: **{sum(len(p['questions']) for m in pyq.get('modules', []) for p in m['papers'])}**")
        lines.append(f"- `#syllabus` scoping section in notes: **{'yes' if has_syl else 'NO'}**")
        if dupes:
            lines.append(f"- **DUPLICATED module blocks: {dupes}** — these modules "
                         f"render twice in the notes. Content bug, not coverage.")
            totals["duplicated"] = totals.get("duplicated", 0) + len(dupes)
        lines.append("")

        lines.append("| Syllabus unit | Notes | Tracker | Matched tokens | Verdict |")
        lines.append("|---|---|---|---|---|")
        # Both sides are matched against the UNION of headings, not per-item.
        # Per-item matching failed a unit whose words were split across two
        # headings while the same unit passed on the tracker side, producing
        # "tracked but no notes" for material the notes plainly contain.
        note_blob = " ".join(list(mods.values()) + toc)
        body_blob = note_body(slug)
        tracker_blob = " ".join(t for _, t in topics)
        for unit in units:
            n_tier, _n_frac, n_hit = strength(unit, note_blob)
            b_tier, _b_frac, _b_hit = strength(unit, body_blob)
            t_tier, _t_frac, t_hit = strength(unit, tracker_blob)
            in_notes = n_tier in ("strong", "partial")
            in_tracker = t_tier in ("strong", "partial")
            if in_notes and in_tracker:
                verdict = "covered + tracked"
            elif in_notes:
                verdict = "**covered but untracked**"
                totals["untracked"] += 1
            elif in_tracker and b_tier in ("strong", "partial"):
                # Content exists but no heading marks it, so the tracker can
                # certify a topic the notes never advertise. Different fix from
                # a true content gap: add a heading, do not write notes.
                verdict = "**no notes heading** (body text mentions it)"
                totals["no_heading"] += 1
            elif in_tracker:
                verdict = "**tracked but no notes**"
                totals["unsupported"] += 1
            elif b_tier in ("strong", "partial"):
                verdict = "**notes body has it, no heading, untracked**"
                totals["no_heading"] += 1
            else:
                verdict = "**MISSING**"
                totals["missing"] += 1
            if "partial" in (n_tier, t_tier):
                verdict += " *(weak match — verify by hand)*"
            lines.append(f"| {unit} | {n_tier} | {t_tier} | "
                         f"{', '.join(n_hit) or '—'} | {verdict} |")
        lines.append("")

        if extra:
            hits = [u for u in units if u.lower() in extra.lower()]
            lines.append(f"Cross-check against the supplied syllabus text: "
                         f"{len(hits)}/{len(units)} unit headings found verbatim.")
            lines.append("")

    lines.append("## Totals")
    lines.append("")
    lines.append(f"- Units MISSING from both notes and tracker: **{totals['missing']}**")
    lines.append(f"- Units covered in notes but not tracked: **{totals['untracked']}**")
    lines.append(f"- Units tracked with no notes behind them: **{totals['unsupported']}**")
    lines.append(f"- Units present in body text but with no heading: **{totals['no_heading']}**")
    lines.append("")
    lines.append("## How to read this")
    lines.append("")
    lines.append("\"covered + tracked\" means a syllabus unit has note headings AND a")
    lines.append("tracker topic, so marking it covered corresponds to real material.")
    lines.append("Everything else is a gap that a passing build and a green test suite")
    lines.append("will not tell you about.")
    lines.append("")

    OUT.write_text("\n".join(lines))
    print(f"written: {OUT.relative_to(ROOT)}")
    print(f"missing={totals['missing']} untracked={totals['untracked']} "
          f"unsupported={totals['unsupported']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
