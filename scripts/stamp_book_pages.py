#!/usr/bin/env python3
"""
Resolve printed page numbers for FM book questions from Bansal's own table of
contents, and flag questions the professor's handout says to skip.

WHY THE TOC AND NOT A TEXT SEARCH
A body-text search for "Problem 2.3" hits cross-reference lists in later
chapters and OCR-mangled headings, so it returns confident nonsense. The
contents pages list `Solved Problems 2.1-2.3   44` — the book's own page for
each problem. That is the number a student sees when they flip the book, which
is the only page reference worth storing.

WHY EXCLUSIONS ARE STAMPED
The professor's handout in `fm.html` lists specific problems to SKIP (e.g.
Ch.1 probs 1.20-1.23). A book question the notes cite as practice may be on
that list. Shipping it as normal practice would be sending the student at
work they were told to avoid, so the exclusion is carried in the data and
rendered in the UI.

Anything not found in the TOC keeps page = null. Never a guess.
"""

import json
import re
from pathlib import Path

import pymupdf

ROOT = Path("D:/Code/MechVault")
BANSAL = ROOT / "books" / (
    "A Textbook of Fluid Mechanics and Hydraulic Machines -- R_ K_ Bansal "
    "-- 2015 -- 60f04ab2c51ecf7b3ece341cdc19c622 -- Anna\u2019s Archive.pdf"
)
BANK = ROOT / "src" / "lib" / "tracker" / "book-bank.json"
NOTES = ROOT / "src" / "content" / "fm.html"

# `Solved Problem 2.5 42`  /  `Solved Problems 1.15-1.17  26`
RANGE = re.compile(
    r"Solved\s+Problems?\s+(\d+\.\d+)\s*-\s*(\d+\.\d+)\s+(\d{1,4})",
    re.IGNORECASE,
)
SINGLE = re.compile(
    r"Solved\s+Problem\s+(\d+\.\d+)\s+(\d{1,4})",
    re.IGNORECASE,
)


def toc_pages(doc):
    """{qno: printed page} harvested from the contents pages."""
    out = {}
    for i in range(3, 22):                       # contents live in the front
        text = doc[i].get_text()
        for start, end, page in RANGE.findall(text):
            a, b = start.split("."), end.split(".")
            if a[0] != b[0]:                    # ranges never span chapters
                continue
            for n in range(int(a[1]), int(b[1]) + 1):
                out.setdefault(f"{a[0]}.{n}", int(page))
        for qno, page in SINGLE.findall(text):
            out.setdefault(qno, int(page))
    return out


def excluded_problems():
    """Problem numbers the professor's handout marks EXCLUDE in the notes."""
    if not NOTES.exists():
        return set()
    text = NOTES.read_text(encoding="utf-8", errors="replace")
    found = set()
    # Rows read: <td>... probs 1.20, 1.21, 1.22, 1.23</td>
    for row in re.findall(r"<tr>(.*?)</tr>", text, re.S):
        cells = re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)
        if len(cells) < 3:
            continue
        exclude = re.sub(r"<[^>]+>", "", cells[2])
        if "prob" not in exclude.lower():
            continue
        for chunk in re.split(r"[,\s]+", exclude):
            m = re.match(r"(\d+\.\d+)\s*[-–]\s*(\d+\.\d+)", chunk)
            if m:
                a, b = m.group(1).split("."), m.group(2).split(".")
                if a[0] == b[0]:
                    found.update(f"{a[0]}.{n}" for n in range(int(a[1]), int(b[1]) + 1))
                continue
            if re.fullmatch(r"\d+\.\d+", chunk):
                found.add(chunk)
    return found


def main():
    if not BANSAL.exists():
        raise SystemExit(f"book not found: {BANSAL}")
    doc = pymupdf.open(BANSAL)
    pages = toc_pages(doc)
    excluded = excluded_problems()
    doc.close()

    bank = json.loads(BANK.read_text(encoding="utf-8"))
    questions = bank["fm"]["questions"]

    print(f"TOC entries harvested: {len(pages)}")
    print(f"Professor EXCLUDE list: {len(excluded)} problem(s)\n")
    print(f"{'Q':>6}  {'page':>5}  {'excluded':>9}")
    for q in questions:
        qno = q["qno"]
        page = pages.get(qno)
        q["page"] = page
        q["excluded"] = qno in excluded
        flag = "SKIP" if q["excluded"] else ""
        print(f"{qno:>6}  {str(page or '-'):>5}  {flag:>9}")

    BANK.write_text(json.dumps(bank, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nwrote {BANK}")


if __name__ == "__main__":
    main()