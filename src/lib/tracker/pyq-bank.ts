/**
 * PYQ question bank — the real exam questions, extracted from the notes.
 *
 * WHY A GENERATED FILE
 * The questions already existed as rows of the `#modpyq` tables in
 * `src/content/<slug>.html` — one row per question, grouped by module and paper.
 * The tracker could say "19 PYQs" but could not show, link or drill into them.
 *
 * `scripts/extract-pyq-bank.py` turns those rows into this file. It is
 * generated, not hand-edited: edit the content HTML and re-run the script, or
 * run it with `--check` in CI to prove the bank still matches the notes.
 *
 * HONESTY RULES BAKED INTO THE DATA
 * - Nothing here is invented. Every `text` is verbatim from the notes' table.
 * - `moduleTagInferred: true` marks a MID paper whose module tag came from
 *   keyword matching rather than BIT's verified Qn -> Module n convention.
 *   The UI must show that distinction; an inferred tag is not a fact.
 * - A subject with no `#modpyq` section gets `modules: []` plus a `note`
 *   explaining why. fm and numerical are exactly that case, and their empty
 *   banks are a real gap in the vault, not a bug in this file.
 */

export interface PyqQuestion {
  /** Question label exactly as the paper prints it: "Q.1", "Q1(a)", "Q3". */
  qno: string;
  /** Verbatim question text. Never paraphrased or truncated. */
  text: string;
  /** Marks for the question when the paper states them. */
  marks?: number;
}

export interface PyqPaper {
  /** Human label, e.g. "MO2023" or "END MO25". */
  paper: string;
  /** MID / END where the source states it. */
  type?: string;
  /**
   * Module tag on this paper was inferred by keyword matching, not by BIT's
   * verified Qn -> Module n ordering. True on MID papers of materials and
   * manufacturing. Render these differently and say so.
   */
  moduleTagInferred?: boolean;
  /** Repo-relative path to the scanned page, served through /api/file. */
  scanPath?: string;
  questions: PyqQuestion[];
}

export interface PyqModule {
  module: number;
  name: string;
  papers: PyqPaper[];
}

export interface PyqSubject {
  code: string;
  modules: PyqModule[];
  /** Why this subject has no questions, when it has none. */
  note?: string;
}

import bankJson from "./pyq-bank.json";

export const PYQ_BANK = bankJson as unknown as Record<string, PyqSubject>;

/** Stable id for a single question, unique within a subject. */
export function questionId(module: number, paper: string, qno: string): string {
  return `${module}.${paper.replace(/\s+/g, "-").toLowerCase()}.${qno
    .replace(/[^\w.()]/g, "")
    .toLowerCase()}`;
}

export interface IndexedQuestion extends PyqQuestion {
  id: string;
  module: number;
  moduleName: string;
  paper: string;
  type: string;
  moduleTagInferred: boolean;
  scanPath?: string;
}

const indexCache = new Map<string, IndexedQuestion[]>();

/** Every real question for a subject, flattened, in module then paper order. */
export function questionsFor(slug: string): IndexedQuestion[] {
  const hit = indexCache.get(slug);
  if (hit) return hit;
  const subject = PYQ_BANK[slug];
  const out: IndexedQuestion[] = [];
  if (subject) {
    for (const m of subject.modules) {
      for (const p of m.papers) {
        for (const q of p.questions) {
          out.push({
            ...q,
            id: questionId(m.module, p.paper, q.qno),
            module: m.module,
            moduleName: m.name,
            paper: p.paper,
            type: p.type ?? "",
            moduleTagInferred: p.moduleTagInferred === true,
            scanPath: p.scanPath,
          });
        }
      }
    }
  }
  indexCache.set(slug, out);
  return out;
}

/** Questions belonging to one module of a subject. */
export function questionsForModule(slug: string, module: number): IndexedQuestion[] {
  return questionsFor(slug).filter((q) => q.module === module);
}

export interface PyqCoverage {
  code: string;
  moduleCount: number;
  questionCount: number;
  paperCount: number;
  marksTotal: number;
  /** True when the subject genuinely has no per-question PYQ data. */
  empty: boolean;
  note?: string;
  inferredPapers: number;
}

export function coverageFor(slug: string): PyqCoverage {
  const subject = PYQ_BANK[slug];
  const qs = questionsFor(slug);
  if (!subject) {
    return {
      code: "",
      moduleCount: 0,
      questionCount: 0,
      paperCount: 0,
      marksTotal: 0,
      empty: true,
      note: "subject not in the PYQ bank",
      inferredPapers: 0,
    };
  }
  const papers = subject.modules.flatMap((m) => m.papers);
  return {
    code: subject.code,
    moduleCount: subject.modules.length,
    questionCount: qs.length,
    paperCount: papers.length,
    marksTotal: qs.reduce((n, q) => n + (q.marks ?? 0), 0),
    empty: qs.length === 0,
    note: subject.note,
    inferredPapers: papers.filter((p) => p.moduleTagInferred).length,
  };
}

/** All subjects that carry real per-question PYQ data. */
export function subjectsWithPyqs(): string[] {
  return Object.keys(PYQ_BANK).filter((s) => questionsFor(s).length > 0);
}
