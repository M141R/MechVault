/**
 * Tracker engine — pure functions only.
 *
 * Nothing in this file touches the database or Astro. That is deliberate: the
 * rules that decide whether an item *may* advance are the rules most likely to
 * be quietly wrong, and a wrong rule here would inflate the user's own progress
 * numbers. Keeping them pure means they can be unit-tested directly.
 */

export const TOPIC_STATES = [
  "unseen",
  "read",
  "rederived",
  "self-tested",
  "exam-ready",
  "flaky",
] as const;
export type TopicStateName = (typeof TOPIC_STATES)[number];

export const PROBLEM_STATES = [
  "unseen",
  "attempted-fail",
  "understood",
  "solved-cold",
  "exam-speed",
] as const;
export type ProblemStateName = (typeof PROBLEM_STATES)[number];

/** Stages that count as genuinely covered for the coverage figure. */
export const TOPIC_COVERED: ReadonlySet<TopicStateName> = new Set([
  "self-tested",
  "exam-ready",
]);
/** The single stage that means "I can produce this with no notes". */
export const TOPIC_MASTERED: ReadonlySet<TopicStateName> = new Set(["exam-ready"]);

export const PROBLEM_COVERED: ReadonlySet<ProblemStateName> = new Set([
  "solved-cold",
  "exam-speed",
]);
export const PROBLEM_MASTERED: ReadonlySet<ProblemStateName> = new Set(["exam-speed"]);

/**
 * Allowed forward transitions.
 *
 * `self-tested` from `read` is deliberately absent — the gate. You cannot mark
 * an item self-tested without having reproduced it first. Everything else is
 * reversible so that a bad call can always be undone.
 */
const TOPIC_TRANSITIONS: Record<TopicStateName, readonly TopicStateName[]> = {
  unseen: ["read", "flaky"],
  read: ["rederived", "unseen"],
  rederived: ["self-tested", "read", "flaky"],
  "self-tested": ["exam-ready", "rederived", "flaky"],
  "exam-ready": ["flaky", "self-tested"],
  flaky: ["read", "rederived", "exam-ready"],
};

const PROBLEM_TRANSITIONS: Record<ProblemStateName, readonly ProblemStateName[]> = {
  unseen: ["attempted-fail", "understood"],
  "attempted-fail": ["understood", "unseen"],
  understood: ["solved-cold", "attempted-fail"],
  "solved-cold": ["exam-speed", "understood"],
  "exam-speed": ["understood"],
};

export interface TransitionResult {
  ok: boolean;
  reason?: string;
}

export function canTransitionTopic(
  from: TopicStateName,
  to: TopicStateName,
): TransitionResult {
  if (from === to) return { ok: true };
  if (!TOPIC_TRANSITIONS[from]?.includes(to)) {
    if (from === "read" && to === "self-tested") {
      return {
        ok: false,
        reason:
          "Gated: you have read this but not reproduced it. Mark it `rederived` first — reading is not mastery.",
      };
    }
    return { ok: false, reason: `Cannot move ${from} → ${to}.` };
  }
  return { ok: true };
}

export function canTransitionProblem(
  from: ProblemStateName,
  to: ProblemStateName,
): TransitionResult {
  if (from === to) return { ok: true };
  if (!PROBLEM_TRANSITIONS[from]?.includes(to)) {
    if (from === "unseen" && to === "solved-cold") {
      return {
        ok: false,
        reason:
          "Gated: a cold solve requires a recorded failed attempt first, so the log shows what you learned.",
      };
    }
    return { ok: false, reason: `Cannot move ${from} → ${to}.` };
  }
  return { ok: true };
}

/**
 * Hints consumed at each stage, enforced.
 *
 * A solve that needed 3 hints is evidence of understanding, not of exam
 * readiness. `exam-speed` therefore requires zero hints — otherwise the tracker
 * would let hint-assisted work inflate readiness, which is precisely the
 * illusion the tracker exists to prevent.
 */
export function hintBudgetAllows(
  target: ProblemStateName,
  hintLevel: number,
): TransitionResult {
  if (target === "exam-speed" && hintLevel > 0) {
    return {
      ok: false,
      reason: `Gated: this solve used ${hintLevel} hint(s). Re-solve it cold to reach exam-speed.`,
    };
  }
  return { ok: true };
}

export interface CoverageCounts {
  total: number;
  seen: number;
  covered: number;
  mastered: number;
  flaky: number;
}

function tally(
  total: number,
  states: readonly string[],
  coveredSet: ReadonlySet<string>,
  masteredSet: ReadonlySet<string>,
): CoverageCounts {
  let seen = 0;
  let covered = 0;
  let mastered = 0;
  let flaky = 0;
  for (const s of states) {
    if (s !== "unseen") seen += 1;
    if (coveredSet.has(s)) covered += 1;
    if (masteredSet.has(s)) mastered += 1;
    if (s === "flaky") flaky += 1;
  }
  return { total, seen, covered, mastered, flaky };
}

/** Percentage is over TOTAL items, so a blank subject honestly reads 0%. */
export function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

export function countDaysUntil(iso: string, now = new Date()): number {
  const target = new Date(`${iso}T00:00:00`);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

export { tally };
