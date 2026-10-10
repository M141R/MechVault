#!/usr/bin/env python3
"""
Extend the book-question bank to Pytel & Singer (Strength of Materials).

WHY PYTEL NEEDS A SEPARATE PARSER
Bansal numbers its exercises per chapter: `Solved Problems 1.3-1.15`. Pytel runs
one continuous sequence across the whole book: problem 102 is the first, 991 the
last, and the hundreds digit is the chapter. So chapter and problem number come
out of one token: 402 is chapter 4, problem 02.

The chapter is ALSO read from the running head (`4/SHEAR AND MOMENT IN BEAMS`),
which only prints on some pages, so the head is carried forward rather than
required on every page. Where the two disagree the running head wins, because
the head is what the book prints.

WHY A LOOSE MATCH FOR THE STATEMENT
A problem statement begins `NNN. Capital`, but OCR frequently drops the line
break so the number lands at the end of a line with the text on the next. Both
shapes are accepted; a number that appears only as a bare `NNN.` with no
following capital anywhere is not counted, which is what keeps the count from
inflating with page furniture.

HONESTY RULES
- Only problems whose statement was actually seen are listed. The PDF scan has
  holes; those problems are absent rather than guessed at.
- Printed page numbers come from the folio at the top of the page the statement
  was found on. A problem whose page could not be read keeps page = null.
- A problem whose chapter could not be resolved keeps module = null; the UI
  says so instead of guessing.
"""

import json
import re
from pathlib import Path

ROOT = Path("D:/Code/MechVault")
BANK = ROOT / "src" / "lib" / "tracker" / "book-bank.json"
BOOK = ROOT / "books" / (
    "Strength of Materials -- Andrew Pytel, Ferdinand Leon Singer -- 4th ed_, "
    "New York, New York State, 1987 -- HarperCollins Publishers  - Copy.pdf"
)

# Pytel chapter -> official SOM module.
# M1 stress at a point · M2 beams, bending & shear · M3 deflection & torsion
# M4 buckling & strain energy · M5 thin & thick cylinders
CHAPTER_MODULE = {
    3: 3,   # torsion
    4: 2,   # shear and moment in beams
    5: 2,   # stresses in beams (flexure, horizontal shear)
    6: 3,   # beam deflections
    7: 3,   # restrained beams
    8: 3,   # continuous beams
    9: 1,   # combined stresses: Mohr's circle, strain rosette
}

# Chapters deliberately left out of the bank.
#
# Ch.1 Simple Stress and Ch.2 Simple Strain are Pytel's introduction to axial
# loading and deformation. BIT Mesra puts neither in module 1, whose syllabus
# text is "stress at a point" -- stress transformation, principal stresses,
# Mohr's circle, strain rosette. That is Pytel Ch.9 and only Ch.9. Including
# 1 and 2 would put elementary bar problems into the module that asks for
# Mohr's circle, which is the exact mislabelling the tracker exists to prevent.
#
# Ch.10 onward (reinforced concrete, columns, connections, special topics,
# thick-walled cylinders) are not carried either: the vault tracks the five
# BIT modules, and a chapter the exam never draws from is noise on a page the
# student reads in a phone-sized burst.
DROPPED_CHAPTERS = {
    1: "Simple Stress — BIT module 1 is stress at a point, not axial bar basics.",
    2: "Simple Strain — same reason; strain transformation is taught in Ch.9 here.",
}

# `4/SHEAR AND MOMENT IN BEAMS`
HEAD_RE = re.compile(r"(?:^|\n)(\d{1,2})/([A-Z][A-Za-z \-]+?)\s*$", re.M)
# Printed folio. It sits in the first two lines of the page but the running
# head sometimes comes first, so scan both rather than anchoring to line 1.
FOLIO_RE = re.compile(r"^\s*(\d{1,3})\s*$")
# `NNN. Capital` — the shape of a problem statement
STMT_RE = re.compile(r"(?:^|\n)(\d{3})\.\s+([A-Z][a-z])")


def scan():
    import pymupdf

    doc = pymupdf.open(BOOK)
    found = {}
    chapter = None
    title = None

    for i in range(20, doc.page_count):
        text = doc[i].get_text()

        head = HEAD_RE.search(text[:140])
        if head:
            chapter = int(head.group(1))
            title = head.group(2).strip()

        # The folio is the first bare number among the first two lines. Line 1
        # is skipped when it is the running head, which is never a bare number.
        printed = None
        for line in text.split("\n")[:2]:
            m = FOLIO_RE.match(line)
            if m and int(m.group(1)) > 5:
                printed = int(m.group(1))
                break

        for m in STMT_RE.finditer(text):
            n = int(m.group(1))
            if n in found:
                continue
            ch = chapter if chapter is not None else n // 100
            found[n] = {
                "qno": str(n),
                "display": f"Pytel Prob. {n}",
                "chapter": str(ch) if ch else None,
                "chapterTitle": title if ch == chapter else None,
                "marks": None,
                "module": CHAPTER_MODULE.get(ch),
                "page": printed,
                "excluded": False,
                "source": "book-body",
            }

    doc.close()
    return {n: q for n, q in found.items()
            if int(q["chapter"] or 0) not in DROPPED_CHAPTERS}


def main():
    if not BOOK.exists():
        raise SystemExit(f"textbook not found: {BOOK}")

    found = scan()
    numbers = sorted(found)

    bank = json.loads(BANK.read_text(encoding="utf-8"))
    questions = [found[n] for n in numbers]

    per_chapter = {}
    for q in questions:
        per_chapter[q["chapter"]] = per_chapter.get(q["chapter"], 0) + 1

    bank["som"] = {
        "code": "SOM",
        "textbook": {
            "title": "Strength of Materials",
            "author": "Andrew Pytel & Ferdinand L. Singer",
            "edition": "4th",
        },
        "note": (
            "Enumerated from the problem statements in the book body. The scan "
            "has holes, so some problem numbers are absent rather than listed "
            "as empty. Printed pages come from the folio on the page where each "
            "statement was found."
        ),
        "partialChapters": [],
        "questions": questions,
    }

    BANK.write_text(json.dumps(bank, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"SOM problems found: {len(questions)}  (Pytel range {numbers[0]}-{numbers[-1]})")
    missing_pages = sum(1 for q in questions if q["page"] is None)
    missing_ch = sum(1 for q in questions if not q["chapter"])
    print(f"  page not read:   {missing_pages}")
    print(f"  chapter unknown: {missing_ch}")
    for ch in sorted(per_chapter, key=lambda c: int(c) if c else 0):
        qs = [q for q in questions if q["chapter"] == ch]
        lo = min(int(q["qno"]) for q in qs)
        hi = max(int(q["qno"]) for q in qs)
        rng = str(lo) + "-" + str(hi)
        title = qs[0].get("chapterTitle") or ""
        print(f"   Ch{ch:<3} {title[:34]:<34} {len(qs):>3} problems  {rng}")
    print(f"\nwrote {BANK}")


if __name__ == "__main__":
    main()