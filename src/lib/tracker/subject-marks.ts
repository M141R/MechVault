/**
 * Subject marks for the dashboard cards.
 *
 * GENERATED FILE - do not edit by hand.
 * Regenerate with: python3 scripts/make-subject-marks.py
 *
 * FIGlet `small` renders of the subject codes, so the letterforms are real
 * geometry rather than something typed by eye, and every mark sits on the
 * same baseline grid.
 *
 * WHY NOT A BIGGER FONT
 * A banner font at `big`/`doom` runs 20+ characters wide and six lines tall,
 * which inside a card in a two-up grid turns every subject into a poster and
 * buries the coverage numbers. `small` is 12-19 characters and four lines: it
 * reads as a maker's mark in the corner of the card, not as a headline.
 */

export const MARK_FONT = "small";

export const SUBJECT_MARKS: Record<string, string> = {
  FM: [
    " ___ __  __",
    "| __|  \/  |",
    "| _|| |\/| |",
    "|_| |_|  |_|",
  ].join("\n"),
  SOM: [
    " ___  ___  __  __",
    "/ __|/ _ \|  \/  |",
    "\__ \ (_) | |\/| |",
    "|___/\___/|_|  |_|",
  ].join("\n"),
  TH: [
    " _____ _  _",
    "|_   _| || |",
    "  | | | __ |",
    "  |_| |_||_|",
  ].join("\n"),
  MAT: [
    " __  __   _ _____",
    "|  \/  | /_\_   _|",
    "| |\/| |/ _ \| |",
    "|_|  |_/_/ \_\_|",
  ].join("\n"),
  MFG: [
    " __  __ ___ ___",
    "|  \/  | __/ __|",
    "| |\/| | _| (_ |",
    "|_|  |_|_| \___|",
  ].join("\n"),
  NUM: [
    " _  _ _   _ __  __",
    "| \| | | | |  \/  |",
    "| .` | |_| | |\/| |",
    "|_|\_|\___/|_|  |_|",
  ].join("\n"),
};

/** The mark for a subject, or null when a subject has not been given one. */
export function subjectMark(code: string): string | null {
  return SUBJECT_MARKS[code] ?? null;
}
