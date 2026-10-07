/**
 * Local tracker store — the no-database path for tracker state.
 *
 * Used when AUTH_MODE=*** There is no server to hold state, so it lives in
 * localStorage, scoped to this browser.
 *
 * THE HONEST LIMITATION, which the UI states on screen:
 *   state is per-browser, not per-account. Clearing site data, or opening the
 *   vault on a different device, shows an empty tracker. Do not read a reset
 *   tracker as a reset understanding.
 *
 * The SAME gates from engine.ts are enforced here as in store.ts. The rule
 * logic is imported rather than reimplemented, so the two backends cannot
 * drift apart — otherwise switching backends would silently change what counts
 * as mastery.
 */

import {
  canTransitionTopic,
  canTransitionProblem,
  hintBudgetAllows,
  type TopicStateName,
  type ProblemStateName,
} from "./engine";
import { allTopicKeys, allProblemKeys } from "./config";

const TOPICS_KEY = "mv_tracker_topics_v1";
const PROBLEMS_KEY = "mv_tracker_problems_v1";

export interface LocalTopic {
  key: string;
  state: string;
  errorReason?: string | null;
  lastTestedAt?: string | null;
}

export interface LocalProblem {
  key: string;
  state: string;
  hintLevel: number;
  errorReason?: string | null;
  attempts: number;
  coldSolvedAt?: string | null;
  examSpeedAt?: string | null;
}

function read<T>(storageKey: string): Record<string, T> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Record<string, T>) : {};
  } catch {
    // Corrupt or unreadable storage must not break the page.
    return {};
  }
}

function write<T>(storageKey: string, data: Record<string, T>): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    // Quota exceeded: surface nothing silently in the data layer; the caller
    // reports success only if this did not throw.
  }
}

export function readLocalStates(): {
  topics: LocalTopic[];
  problems: LocalProblem[];
} {
  const topics = read<LocalTopic>(TOPICS_KEY);
  const problems = read<LocalProblem>(PROBLEMS_KEY);
  return { topics: Object.values(topics), problems: Object.values(problems) };
}

export interface LocalResult {
  ok: boolean;
  error?: string;
}

export function updateLocalTopic(update: {
  key: string;
  state: string;
  errorReason?: string | null;
}): LocalResult {
  if (!allTopicKeys().has(update.key)) {
    return { ok: false, error: `Unknown topic key: ${update.key}` };
  }
  const all = read<LocalTopic>(TOPICS_KEY);
  const prev = all[update.key];
  const from = (prev?.state ?? "unseen") as TopicStateName;
  const gate = canTransitionTopic(from, update.state as TopicStateName);
  if (!gate.ok) return { ok: false, error: gate.reason };

  const testing = update.state === "self-tested" || update.state === "exam-ready";
  all[update.key] = {
    key: update.key,
    state: update.state,
    errorReason: update.errorReason ?? prev?.errorReason ?? null,
    lastTestedAt: testing ? new Date().toISOString() : (prev?.lastTestedAt ?? null),
  };
  write(TOPICS_KEY, all);
  return { ok: true };
}

export function updateLocalProblem(update: {
  key: string;
  state: string;
  hintLevel?: number;
  errorReason?: string | null;
}): LocalResult {
  if (!allProblemKeys().has(update.key)) {
    return { ok: false, error: `Unknown problem key: ${update.key}` };
  }
  const all = read<LocalProblem>(PROBLEMS_KEY);
  const prev = all[update.key];
  const from = (prev?.state ?? "unseen") as ProblemStateName;
  const hintLevel = update.hintLevel ?? prev?.hintLevel ?? 0;

  const gate = canTransitionProblem(from, update.state as ProblemStateName);
  if (!gate.ok) return { ok: false, error: gate.reason };
  const budget = hintBudgetAllows(update.state as ProblemStateName, hintLevel);
  if (!budget.ok) return { ok: false, error: budget.reason };

  const now = new Date().toISOString();
  all[update.key] = {
    key: update.key,
    state: update.state,
    hintLevel,
    errorReason: update.errorReason ?? prev?.errorReason ?? null,
    attempts: (prev?.attempts ?? 0) + (update.state === "understood" ? 1 : 0),
    coldSolvedAt:
      update.state === "solved-cold" ? now : (prev?.coldSolvedAt ?? null),
    examSpeedAt: update.state === "exam-speed" ? now : (prev?.examSpeedAt ?? null),
  };
  write(PROBLEMS_KEY, all);
  return { ok: true };
}

/** Whole-state export, so a browser-local tracker can be backed up or moved. */
export function exportLocalState(): string {
  return JSON.stringify(
    { version: 1, exportedAt: new Date().toISOString(), topics: read(TOPICS_KEY), problems: read(PROBLEMS_KEY) },
    null,
    2,
  );
}
