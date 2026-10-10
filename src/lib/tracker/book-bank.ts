/**
 * Book question bank — textbook problems from the notes.
 *
 * WHY A GENERATED FILE
 * The questions already existed as 📖 markers in `src/content/<slug>.html` —
 * one marker per book problem, with chapter, marks, and module inference.
 * `scripts/extract_book_qs.py` turns those markers into this file.
 * Edit the content HTML and re-run the script, or run with `--check` in CI.
 *
 * HONESTY RULES
 * - Nothing here is invented. Every `display` is verbatim from the notes.
 * - `module` is inferred from the chapter-to-module syllabus mapping; it may be
 *   wrong if the chapter spans modules. The UI must show that distinction.
 * - A subject with no 📖 markers gets an empty array — that is a real gap in the
 *   vault, not a bug in this file.
 */

export interface BookQuestion {
  /** Question number as the book prints it: "1.1", "2.15", etc. */
  qno: string;
  /** Verbatim display text from the notes' 📖 marker. */
  display: string;
  /** Book chapter the question comes from (inferred from marker). */
  chapter: string | null;
  /**
   * Chapter title as the book prints it (`9 — COMBINED STRESSES`), when the
   * scan could read it. Pytel carries it in the running head.
   */
  chapterTitle?: string | null;
  /** Marks when the notes state them. */
  marks?: number;
  /** Official module this question maps to (inferred from chapter). */
  module: number | null;
  /**
   * PRINTED page in the physical book, harvested from Bansal's own contents
   * pages. Null when the TOC does not list it — the UI says "page not listed"
   * rather than showing an index that only exists in the PDF.
   */
  page?: number | null;
  /**
   * The professor's handout lists this problem under EXCLUDE. The notes still
   * cite it as practice, so it is surfaced with a conflict flag instead of
   * being silently presented as normal work.
   */
  excluded?: boolean;
  /** How this was extracted. */
  source: "explicit-marker" | "inline-example";
}

export interface BookSubject {
  code: string;
  textbook?: {
    title: string;
    author: string;
    edition?: string;
  } | null;
  /** How this bank was produced, and what it does not claim. */
  note?: string;
  /**
   * Chapters whose contents-page problem range had to be repaired from an
   * OCR-garbled line. Their counts are lower bounds, not exact totals.
   */
  partialChapters?: number[];
  questions: BookQuestion[];
}

import bankJson from "./book-bank.json";

export const BOOK_BANK = bankJson as unknown as Record<string, BookSubject>;

/**
 * Stable state key for a book question, shared by the tracker, the
 * book-questions page, and the store's key validation.
 *
 * WHY THIS LIVES HERE AND NOT AT EACH CALL SITE
 * The key was previously built by a `bookKey()` copy pasted into both
 * track.astro and book-questions.astro, while `allProblemKeys()` in
 * config.ts validated against config's own `problems` array only. Nothing
 * connected the two, so ticking a textbook row produced
 * `Unknown problem key: bq.fm.m1.1.1` and the checkbox did nothing. One
 * builder, imported by all three call sites, is the fix.
 *
 * The `bq.` prefix keeps these from ever colliding with a config key.
 */
export function bookProblemKey(
  slug: string,
  q: { module: number | null; qno: string },
): string {
  return `bq.${slug}.m${q.module ?? 0}.${q.qno}`;
}

/** Every book-problem key the store will accept, across all subjects. */
export function allBookProblemKeys(): Set<string> {
  const s = new Set<string>();
  for (const [slug, subject] of Object.entries(BOOK_BANK)) {
    if (!subject?.questions) continue;
    for (const q of subject.questions) s.add(bookProblemKey(slug, q));
  }
  return s;
}

/** Stable id for a single book question, unique within a subject. */
export function bookQuestionId(module: number | null, chapter: string | null, qno: string): string {
  const m = module ?? 0;
  const c = chapter ?? "0";
  return `m${m}.ch${c}.${qno.replace(/[^\\w.()]/g, "").toLowerCase()}`;
}

/** Shortest label that identifies the question when its text is long. */
export function bookQuestionLabel(q: BookQuestion): string {
  return `Ch.${q.chapter ?? "?"} · Q.${q.qno}`;
}

/** `p. 44` when the TOC lists a page, otherwise an honest "not listed". */
export function bookPageLabel(page: number | null | undefined): string {
  return page != null ? `p. ${page}` : "page not listed";
}

export interface IndexedBookQuestion extends BookQuestion {
  id: string;
}

/** Every real book question for a subject, flattened, in module then chapter order. */
export function bookQuestionsFor(slug: string): IndexedBookQuestion[] {
  const subject = BOOK_BANK[slug];
  const out: IndexedBookQuestion[] = [];
  if (subject) {
    for (const q of subject.questions) {
      out.push({
        ...q,
        id: bookQuestionId(q.module, q.chapter, q.qno),
      });
    }
  }
  // Sort by module, then chapter, then qno
  out.sort((a, b) => {
    const ma = a.module ?? 0;
    const mb = b.module ?? 0;
    if (ma !== mb) return ma - mb;
    const ca = parseInt(a.chapter ?? "0", 10);
    const cb = parseInt(b.chapter ?? "0", 10);
    if (ca !== cb) return ca - cb;
    return a.qno.localeCompare(b.qno, undefined, { numeric: true });
  });
  return out;
}

/** Questions belonging to one module of a subject. */
export function bookQuestionsForModule(slug: string, module: number): IndexedBookQuestion[] {
  return bookQuestionsFor(slug).filter((q) => q.module === module);
}

/** Coverage summary for book questions. */
export interface BookCoverage {
  code: string;
  questionCount: number;
  moduleCount: number;
  empty: boolean;
}

export function bookCoverageFor(slug: string): BookCoverage {
  const subject = BOOK_BANK[slug];
  if (!subject) {
    return { code: "", questionCount: 0, moduleCount: 0, empty: true };
  }
  const qs = bookQuestionsFor(slug);
  const modules = new Set(qs.map((q) => q.module).filter((m): m is number => m !== null));
  return {
    code: subject.code,
    questionCount: qs.length,
    moduleCount: modules.size,
    empty: qs.length === 0,
  };
}