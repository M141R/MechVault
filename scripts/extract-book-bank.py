#!/usr/bin/env python3
"""Extract book questions from subject HTML content files.

Looks for .question-block elements containing a .q-title with a book prefix,
extracts chapter, question number, marks, question text, and answer.
"""
import re
import json
import sys
from pathlib import Path

CONTENT_DIR = Path("D:/Code/MechVault/src/content")
OUT_FILE = Path("D:/Code/MechVault/src/lib/tracker/book-bank.json")

SUBJECT_BOOK = {
    "fm":          {"label": "Bansal",  "prefix": "📖 Bansal"},
    "som":         {"label": "Pytel",   "prefix": "📘 Pytel"},
    "thermo":      {"label": "Nag/Cengel", "prefix": "📗"},
    "materials":   {"label": "Callister/William", "prefix": "📙"},
    "manufacturing": {"label": "Raghuvanshi/Khurmi", "prefix": "📕"},
    "numerical":   {"label": "Jain/Sastry/Kreyszig", "prefix": "📐"},
}

# Regex for matching book-question titles
TITLE_REGEX = re.compile(
    r'📖\s+Bansal\s+Ch\.\s*(\d+)\s*[—–]\s*Q\.(\d+(?:\.\d+)*)\s*(\([^)]+\))?'
) | re.compile(
    r'📘\s+Pytel[^—–]*[—–]\s*Q\.?\s*(\d+(?:\.\d+)*)'
) | re.compile(
    r'📗\s+.*?[—–]\s*Q\.?\s*(\d+(?:\.\d+)*)'
) | re.compile(
    r'📙\s+.*?[—–]\s*Q\.?\s*(\d+(?:\.\d+)*)'
) | re.compile(
    r'📕\s+.*?[—–]\s*Q\.?\s*(\d+(?:\.\d+)*)'
) | re.compile(
    r'📐\s+.*?[—–]\s*Q\.?\s*(\d+(?:\.\d+)*)'
)

# Fallback: catch any q-title with a book-icon prefix
BOOK_ICON = re.compile(r'^(?:📖|📘|📗|📙|📕|📓|📒|📐|📏)\s', re.UNICODE)

BLOCK_RE = re.compile(
    r'<div class="question-block">\s*(.*?)\s*</div>\s*</div>',
    re.DOTALL
)

def clean_text(s: str) -> str:
    s = re.sub(r'<[^>]+>', '', s)
    s = s.replace('&amp;', '&').replace('&nbsp;', ' ').replace('&mdash;', '—')
    return s.strip()

def extract_from_html(html: str, subject: str):
    questions = []
    book_info = SUBJECT_BOOK.get(subject, {})
    prefix = book_info.get("prefix", "")

    for m in BLOCK_RE.finditer(html):
        block = m.group(1)
        title_m = re.search(r'<div class="q-title">(.*?)</div>', block)
        if not title_m:
            continue
        title = clean_text(title_m.group(1))

        # Must have a book icon prefix
        if not BOOK_ICON.match(title):
            continue

        # Extract question text — first <p> after q-title
        text_m = re.search(r'</div>\s*<p>(.*?)</p>', block)
        qtext = clean_text(text_m.group(1)) if text_m else ""

        # Extract answer (formula-box or answer-block content)
        ans_m = re.search(r'<div class="answer-block">\s*<div class="a-title">.*?</div>\s*(.*?)\s*</div>', block, re.DOTALL)
        answer = ""
        if ans_m:
            answer = clean_text(ans_m.group(1))

        # Parse chapter and qno from title
        chap_m = re.search(r'Ch\.\s*(\d+)', title, re.IGNORECASE)
        qno_m = re.search(r'Q\.?\s*(\d+(?:\.\d+)*)', title)
        marks_m = re.search(r'\(([^)]*?\d.*?marks?.*?)\)', title, re.IGNORECASE)

        questions.append({
            "subject": subject,
            "chapter": int(chap_m.group(1)) if chap_m else 0,
            "qno": qno_m.group(1) if qno_m else "",
            "title": title,
            "text": qtext,
            "answer": answer,
            "marks": marks_m.group(1) if marks_m else "",
        })

    return questions

def main():
    all_questions = {}
    for subject in SUBJECT_BOOK:
        html_file = CONTENT_DIR / f"{subject}.html"
        if not html_file.exists():
            print(f"Missing: {html_file}")
            all_questions[subject] = []
            continue
        html = html_file.read_text(encoding="utf-8")
        qs = extract_from_html(html, subject)
        all_questions[subject] = qs
        print(f"{subject}: {len(qs)} book questions extracted")

    OUT_FILE.write_text(json.dumps(all_questions, indent=2, ensure_ascii=False))
    total = sum(len(v) for v in all_questions.values())
    print(f"\nTotal: {total} questions -> {OUT_FILE}")

if __name__ == "__main__":
    main()
