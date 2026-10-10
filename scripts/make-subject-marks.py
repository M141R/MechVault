#!/usr/bin/env python3
"""
Regenerate `src/lib/tracker/subject-marks.ts` from FIGlet.

WHY THIS EXISTS
The dashboard cards carry a FIGlet mark of each subject code. Hand-typing that
art is how it drifts out of alignment, so the art is generated once and
checked in. Run this after adding a subject:

    python3 scripts/make-subject-marks.py

requires: pip install pyfiglet
"""

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path("D:/Code/MechVault")
OUT = ROOT / "src" / "lib" / "tracker" / "subject-marks.ts"

# The short codes the vault uses on cards, in the order they appear.
CODES = ["FM", "SOM", "TH", "MAT", "MFG", "NUM"]

# One font for every mark, so the letterforms belong to the same set.
FONT = "small"


def render(code: str) -> str:
    r = subprocess.run(
        ["python3", "-m", "pyfiglet", code, "-f", FONT, "-w", "120"],
        capture_output=True,
        text=True,
    )
    if r.returncode != 0:
        raise SystemExit(f"pyfiglet failed for {code}: {r.stderr.strip()}")
    lines = [l.rstrip() for l in r.stdout.split("\n") if l.strip()]
    if not lines:
        raise SystemExit(f"pyfiglet produced no art for {code}")
    return lines


def ts_string(lines: list[str]) -> str:
    body = ",\n".join(f'    "{l}"' for l in lines)
    return f"[\n{body},\n  ].join(\"\\n\")"


def main():
    try:
        import pyfiglet  # noqa: F401
    except ImportError:
        raise SystemExit("pyfiglet not installed. Run: python3 -m pip install pyfiglet")

    marks = {c: render(c) for c in CODES}

    # Every mark should share a height, or the cards will not line up.
    heights = {c: len(v) for c, v in marks.items()}
    if len(set(heights.values())) != 1:
        raise SystemExit(f"marks have mismatched heights: {heights}")

    entries = "\n".join(
        f'  {c}: {ts_string(marks[c])},' for c in CODES
    )

    header = '''/**
 * Subject marks for the dashboard cards.
 *
 * GENERATED FILE - do not edit by hand.
 * Regenerate with: python3 scripts/make-subject-marks.py
 *
 * FIGlet `%s` renders of the subject codes, so the letterforms are real
 * geometry rather than something typed by eye, and every mark sits on the
 * same baseline grid.
 *
 * WHY NOT A BIGGER FONT
 * A banner font at `big`/`doom` runs 20+ characters wide and six lines tall,
 * which inside a card in a two-up grid turns every subject into a poster and
 * buries the coverage numbers. `small` is 12-19 characters and four lines: it
 * reads as a maker's mark in the corner of the card, not as a headline.
 */

export const MARK_FONT = "%s";

export const SUBJECT_MARKS: Record<string, string> = {
%s
};

/** The mark for a subject, or null when a subject has not been given one. */
export function subjectMark(code: string): string | null {
  return SUBJECT_MARKS[code] ?? null;
}
''' % (FONT, FONT, entries)

    OUT.write_text(header, encoding="utf-8")

    print(f"wrote {OUT}")
    for c in CODES:
        w = max(len(l) for l in marks[c])
        print(f"  {c:<4} {w} wide x {len(marks[c])} lines")


if __name__ == "__main__":
    main()