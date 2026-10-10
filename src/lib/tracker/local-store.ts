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
  isTopicState,
  isProblemState,
  TOPIC_STATES,
  PROBLEM_STATES,
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

function write<T>(storageKey: string, data: Record<string, T>): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
    return true;
  } catch {
    // Quota exceeded (or private-mode denial): report failure so the caller
    // can surface it instead of claiming the save succeeded.
    return false;
  }
}

export function readLocalStates(): {
  topics: LocalTopic[];
  problems: LocalProblem[];
} {
  const topics = read<LocalTopic>(TOPICS_KEY);
  const problems = read<LocalProblem>(PROBLEMS_KEY);
  const topicKeys = allTopicKeys();
  const problemKeys = allProblemKeys();
  // Drop stale keys (renamed/removed config entries) and corrupt states on
  // read so a tampered or outdated localStorage can never lock the UI. Stale
  // entries are pruned from storage lazily.
  let prunedTopics = false;
  for (const k of Object.keys(topics)) {
    const t = topics[k];
    if (!topicKeys.has(k) || !isTopicState(String(t?.state ?? ""))) {
      delete topics[k];
      prunedTopics = true;
    }
  }
  let prunedProblems = false;
  for (const k of Object.keys(problems)) {
    const p = problems[k];
    if (!problemKeys.has(k) || !isProblemState(String(p?.state ?? ""))) {
      delete problems[k];
      prunedProblems = true;
    }
  }
  if (prunedTopics) write(TOPICS_KEY, topics);
  if (prunedProblems) write(PROBLEMS_KEY, problems);
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
  if (!(TOPIC_STATES as readonly string[]).includes(update.state)) {
    return { ok: false, error: `Unknown topic state: ${update.state}` };
  }
  const all = read<LocalTopic>(TOPICS_KEY);
  const prev = all[update.key];
  const from = (prev?.state ?? "unseen") as TopicStateName;
  if (!isTopicState(from)) {
    if (update.state !== "unseen") {
      return { ok: false, error: `Unknown state ${from}; reset it to unseen first.` };
    }
  } else {
    const gate = canTransitionTopic(from, update.state as TopicStateName);
    if (!gate.ok) return { ok: false, error: gate.reason };
  }

  const testing = update.state === "self-tested" || update.state === "exam-ready";
  all[update.key] = {
    key: update.key,
    state: update.state,
    errorReason: update.errorReason ?? prev?.errorReason ?? null,
    lastTestedAt: testing ? new Date().toISOString() : (prev?.lastTestedAt ?? null),
  };
  if (!write(TOPICS_KEY, all)) {
    return { ok: false, error: "Browser storage is full or unavailable; the change was not saved." };
  }
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
  if (!(PROBLEM_STATES as readonly string[]).includes(update.state)) {
    return { ok: false, error: `Unknown problem state: ${update.state}` };
  }
  const all = read<LocalProblem>(PROBLEMS_KEY);
  const prev = all[update.key];
  const from = (prev?.state ?? "unseen") as ProblemStateName;
  const hintLevel = update.hintLevel ?? prev?.hintLevel ?? 0;

  if (!isProblemState(from)) {
    if (update.state !== "unseen") {
      return { ok: false, error: `Unknown state ${from}; reset it to unseen first.` };
    }
  } else {
    const gate = canTransitionProblem(from, update.state as ProblemStateName);
    if (!gate.ok) return { ok: false, error: gate.reason };
  }
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
  if (!write(PROBLEMS_KEY, all)) {
    return { ok: false, error: "Browser storage is full or unavailable; the change was not saved." };
  }
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
