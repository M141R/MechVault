#!/usr/bin/env python3
"""
Build the book-question bank from the TEXTBOOK's own tables of contents, minus
the professor's exclude list.

WHY THIS REPLACED THE OLD EXTRACTOR
The previous version scraped 📖 markers out of the notes and found 8 problems,
all in FM chapters 1-2. That was not the book's problem list; it was the eight
exercises the notes happened to cite. Bansal chapter 1 alone runs to Q.1.32.
The chapters were missing because the notes never cited them, not because the
book lacks them.

So the source of truth is the book. For every chapter the PDF's contents pages
list a `Solved Problems <range>` line per topic; those ranges are the real
enumeration. Then the professor's handout (already transcribed into
`src/content/fm.html`) removes the exercises that are out of syllabus.

HONESTY RULES
- Counts come from the book's own contents pages, never invented.
- A problem removed by the exclude list is still recorded, flagged
  `excluded: true`, so the UI can say "skip this" instead of silently
  pretending the book is shorter than it is.
- OCR mangles the TOC ("1.25-1.22"). Where a range's end is unreadable or
  non-monotonic, the chapter is marked `partial` and the note says so rather
  than publishing a fabricated total.
- A subject with no scanned textbook gets an empty bank. That is a real gap.
"""

import json
import re
from pathlib import Path

ROOT = Path("D:/Code/MechVault")
BANK = ROOT / "src" / "lib" / "tracker" / "book-bank.json"
NOTES = ROOT / "src" / "content" / "fm.html"

# Subject -> textbook PDF (only the ones we hold a scan of).
BOOKS = {
    "fm": "A Textbook of Fluid Mechanics and Hydraulic Machines -- R_ K_ Bansal -- 2015 -- 60f04ab2c51ecf7b3ece341cdc19c622 -- Anna’s Archive.pdf",
}

# Chapter -> the official module it belongs to (from the professor's mapping in
# fm.html and the FM syllabus in src/lib/subjects.ts).
CHAPTER_MODULE = {
    1: 1, 2: 1, 3: 1,            # fluid statics
    4: 1,                        # buoyancy (only 3 concepts survive)
    5: 2, 6: 2,                  # kinematics
    7: 3,                        # flow measurement
    8: 3, 9: 3, 10: 3, 11: 3, 12: 3,   # pipes, losses, boundary layer
    13: 5,                       # pumps
    14: 4, 15: 4, 16: 4, 17: 4,  # turbines
}

# `Solved Problems 1.3-1.15` / `Solved Problem 2.5`
RANGE_RE = re.compile(r"Solved\s+Problems?\s+(\d+)\.(\d+)\s*[-–—]\s*(\d+)\.(\d+)")
SINGLE_RE = re.compile(r"Solved\s+Problem\s+(\d+)\.(\d+)(?!\s*[-–—])")


def repair(start: int, end: int) -> tuple[int, bool]:
    """
    Fix an OCR range end.

    The scan drops a stray digit onto the end number: chapter 14 reads
    `14.1-14.15` where the book means `14.1-14.5`, and `14.115` means `14.11`.
    Both show up as an end whose last digit repeats the tens digit
    (`15` after `1`, `115` after `11`).

    Returns the corrected end and whether a repair was applied, so the chapter
    can be reported as partial rather than as a clean count.
    """
    if end < start:
        return start, True                      # reversed: "1.25-1.22"
    # "1-15" after a leading "1" is really "1-5"; "1-115" after "11" is "11".
    if len(str(end)) > len(str(start)) and str(end).startswith(str(start)):
        trimmed = int(str(end)[len(str(start)):])
        if 0 < trimmed <= 9:
            return trimmed, True
    return end, False


def chapters_from_toc(doc):
    """{chapter: [max_problem_number]} harvested from the contents pages."""
    per_chapter = {}

    def record(ch, num):
        per_chapter.setdefault(int(ch), set()).add(int(num))

    for i in range(2, 22):
        text = doc[i].get_text()
        # Ranges. OCR garbles some ends; repair() normalises them and the
        # chapter is flagged partial rather than published as a clean count.
        for a, b, c, d in RANGE_RE.findall(text):
            start, end = int(b), int(d)
            if int(a) != int(c):
                continue                    # a range never spans chapters
            fixed, repaired = repair(start, end)
            record(a, fixed)
            if repaired:
                per_chapter.setdefault("_partial", set()).add(int(a))

        # Singles.
        for ch, num in SINGLE_RE.findall(text):
            ch_i, num_i = int(ch), int(num)
            # "14.115" is really "14.11": a three-digit problem number is not
            # real in a chapter whose problems are otherwise two digits.
            if num_i > 99 and len(str(ch)) == 2:
                num_i = int(str(num_i)[:-1])
                per_chapter.setdefault("_partial", set()).add(ch_i)
            record(ch, num_i)

    return (
        {ch: max(nums) for ch, nums in per_chapter.items() if ch != "_partial"},
        sorted(per_chapter.get("_partial", set())),
    )


def exclude_from_notes():
    """Problem numbers the professor's handout marks EXCLUDE."""
    if not NOTES.exists():
        return set()
    text = NOTES.read_text(encoding="utf-8", errors="replace")
    out = set()
    for row in re.findall(r"<tr>(.*?)</tr>", text, re.S):
        cells = re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)
        if len(cells) < 3:
            continue
        exclude = re.sub(r"<[^>]+>", "", cells[2]).replace("&amp;", "&")
        if "prob" not in exclude.lower():
            continue
        # Only the `probs ...` / `prob ...` part. Section numbers were already
        # filtered by the check above.
        tail = exclude.lower().split("prob", 1)[-1]

        # The handout also uses an `omit a-b` clause (chapter 5), which is an
        # exclusion in everything but name.
        m = re.search(r"omit\s+(\d+)\.(\d+)\s*[-\u2013\u2014]\s*(\d+)\.(\d+)", tail)
        if m:
            a, b, c, d = m.groups()
            if a == c:
                out.update(f"{a}.{n}" for n in range(int(b), int(d) + 1))
        tail = re.split(r"\bomit\b", tail)[0]

        # Ranges and singles may be separated by commas, spaces or semicolons.
        for tok in re.split(r"[,\s]+", tail):
            tok = tok.strip().rstrip(".;")
            rng = re.fullmatch(r"(\d+)\.(\d+)\s*[-\u2013\u2014]\s*(\d+)\.(\d+)", tok)
            if rng:
                a, b, c, d = rng.groups()
                if a == c:
                    out.update(f"{a}.{n}" for n in range(int(b), int(d) + 1))
                continue
            # `5.5A` carries a letter suffix; the digit part is what we track.
            single = re.fullmatch(r"(\d+)\.(\d+)([a-z]?)", tok)
            if single:
                out.add(f"{single.group(1)}.{single.group(2)}")
    return out


def page_starts(doc, chapters):
    """{chapter: printed page} from the contents 'Solved Problems x-y  <page>'."""
    pages = {}
    for i in range(2, 22):
        text = doc[i].get_text()
        # The page number is the trailing integer on the line holding the range.
        for line in text.split("\n"):
            if "Solved Problem" in line:
                pass
        # Ranges can wrap; walk the flat token stream instead.
        tokens = re.findall(r"Solved\s+Problems?\s+\d+\.\d+(?:\s*[-–—]\s*\d+\.\d+)?\s*\n?\s*(\d{1,4})", text)
        for tok in tokens:
            pass
    # Simpler and more reliable: pull (range, page) pairs by position.
    flat = re.findall(
        r"Solved\s+Problems?\s+\d+\.\d+(?:\s*[-–—]\s*\d+\.\d+)?[\s\n]{0,4}(\d{1,4})",
        "\n".join(doc[i].get_text() for i in range(2, 22)),
    )
    return flat


def main():
    import pymupdf

    book = ROOT / "books" / BOOKS["fm"]
    if not book.exists():
        raise SystemExit(f"textbook not found: {book}")

    doc = pymupdf.open(book)
    maxes, partial = chapters_from_toc(doc)
    doc.close()

    excluded = exclude_from_notes()

    questions = []
    for ch in sorted(maxes):
        last = maxes[ch]
        for n in range(1, last + 1):
            qno = f"{ch}.{n}"
            questions.append({
                "qno": qno,
                "display": f"Bansal Ch.{ch} — Q.{qno}",
                "chapter": str(ch),
                "marks": None,
                "module": CHAPTER_MODULE.get(ch),
                "page": None,
                "excluded": qno in excluded,
                "source": "book-toc",
            })

    bank = {
        "fm": {
            "code": "FM",
            "textbook": {
                "title": "A Textbook of Fluid Mechanics and Hydraulic Machines",
                "author": "R.K. Bansal",
                "edition": "9th revised",
            },
            "note": (
                "Enumerated from the book's own contents pages and reduced by the "
                "professor's exclude list. Excluded problems are kept and flagged so "
                "the page can say which to skip."
            ),
            "partialChapters": partial,
            "questions": questions,
        }
    }

    for slug in ["som", "thermo", "materials", "manufacturing", "numerical"]:
        bank[slug] = {
            "code": slug.upper(),
            "textbook": None,
            "note": "No scanned textbook contents parsed for this subject yet.",
            "questions": [],
        }

    BANK.write_text(json.dumps(bank, indent=2, ensure_ascii=False), encoding="utf-8")

    live = [q for q in questions if not q["excluded"]]
    print(f"FM questions enumerated: {len(questions)}")
    print(f"  removed by exclude list: {len(questions) - len(live)}")
    print(f"  study these:             {len(live)}")
    for ch in sorted(maxes):
        chq = [q for q in questions if q["chapter"] == str(ch)]
        chlive = [q for q in chq if not q["excluded"]]
        mark = "  (partial)" if ch in partial else ""
        print(f"   Ch{ch}: {len(chlive)} of {len(chq)}{mark}")
    if partial:
        print(f"\npartial (OCR-garbled TOC) chapters: {partial}")
    print(f"\nwrote {BANK}")


if __name__ == "__main__":
    main()