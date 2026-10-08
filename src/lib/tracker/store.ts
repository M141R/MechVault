/**
 * Tracker store — the only file that talks to the database for tracker state.
 *
 * Read/write is a plain upsert on (user_id, key). There is no separate
 * "sessions" or "attempts" table: the state *is* the record, and `updatedAt`
 * plus the timestamp columns carry the history that matters for exams.
 *
 * SCHEMA BOOTSTRAP
 * The tracker tables are created idempotently on first use rather than relying
 * on a manual `drizzle-kit push` against Neon. Two reasons:
 *   - a personal deploy should not be one manual DB command away from a 500;
 *   - `CREATE TABLE IF NOT EXISTS` is safe to re-run and cheap once cached.
 * The canonical migration SQL is still emitted to `drizzle/` for review.
 */

import { sql } from "drizzle-orm";
import { requireDb, withRetry } from "../db";
import { topicState, problemState } from "../../schema";
import {
  canTransitionTopic,
  canTransitionProblem,
  hintBudgetAllows,
  TOPIC_STATES,
  PROBLEM_STATES,
  type TopicStateName,
  type ProblemStateName,
} from "./engine";
import { allTopicKeys, allProblemKeys } from "./config";

/**
 * One statement per array entry, deliberately NOT one blob.
 *
 * Neon's HTTP driver sends every query as a PREPARED statement, and Postgres
 * refuses more than one command in a prepared statement
 * ("cannot insert multiple commands into a prepared statement"). A single
 * multi-statement DDL string therefore fails at runtime even though it looks
 * correct and passes `astro check` -- the tracker then 500s on first use with
 * an error whose message is the entire DDL blob, which hides the real cause.
 * Verified against the live Neon pooler. Do not merge these back into one string.
 */
const DDL_STATEMENTS = [
  `
CREATE TABLE IF NOT EXISTS "topic_state" (
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "key" text NOT NULL,
  "state" text NOT NULL DEFAULT 'unseen',
  "error_reason" text,
  "last_tested_at" timestamp,
  "updated_at" timestamp DEFAULT now(),
  PRIMARY KEY ("user_id","key")
);
`,
  `CREATE INDEX IF NOT EXISTS "topic_state_user_idx" ON "topic_state" ("user_id");`,
  `
CREATE TABLE IF NOT EXISTS "problem_state" (
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "key" text NOT NULL,
  "state" text NOT NULL DEFAULT 'unseen',
  "hint_level" integer NOT NULL DEFAULT 0,
  "error_reason" text,
  "attempts" integer NOT NULL DEFAULT 0,
  "cold_solved_at" timestamp,
  "exam_speed_at" timestamp,
  "updated_at" timestamp DEFAULT now(),
  PRIMARY KEY ("user_id","key")
);
`,
  `CREATE INDEX IF NOT EXISTS "problem_state_user_idx" ON "problem_state" ("user_id");`,
];

let ready = false;

/** Create the tracker tables if they are missing. Safe to call every time. */
export async function ensureSchema(): Promise<void> {
  if (ready) return;
  const db = requireDb();
  await withRetry(async () => {
    for (const statement of DDL_STATEMENTS) {
      await db.execute(sql.raw(statement));
    }
  });
  ready = true;
}

export interface TopicStateRow {
  key: string;
  state: string;
  errorReason: string | null;
  lastTestedAt: string | null;
}

export interface ProblemStateRow {
  key: string;
  state: string;
  hintLevel: number;
  errorReason: string | null;
  attempts: number;
  coldSolvedAt: string | null;
  examSpeedAt: string | null;
}

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

export async function readStates(userId: string): Promise<{
  topics: TopicStateRow[];
  problems: ProblemStateRow[];
}> {
  await ensureSchema();
  const db = requireDb();
  const [t, p] = await withRetry(() =>
    Promise.all([
      db
        .select()
        .from(topicState)
        .where(sql`${topicState.userId} = ${userId}`),
      db
        .select()
        .from(problemState)
        .where(sql`${problemState.userId} = ${userId}`),
    ]),
  );
  return {
    topics: t.map((r) => ({
      key: r.key,
      state: r.state,
      errorReason: r.errorReason,
      lastTestedAt: iso(r.lastTestedAt),
    })),
    problems: p.map((r) => ({
      key: r.key,
      state: r.state,
      hintLevel: r.hintLevel ?? 0,
      errorReason: r.errorReason,
      attempts: r.attempts ?? 0,
      coldSolvedAt: iso(r.coldSolvedAt),
      examSpeedAt: iso(r.examSpeedAt),
    })),
  };
}

export interface TopicUpdate {
  key: string;
  state: string;
  errorReason?: string | null;
}

export interface ProblemUpdate {
  key: string;
  state: string;
  hintLevel?: number;
  errorReason?: string | null;
}

export interface UpdateResult {
  ok: boolean;
  error?: string;
}

/**
 * Apply a topic transition, enforcing the state machine.
 *
 * Keys not present in the config are rejected: an unknown key would silently
 * accumulate rows that no page ever renders, inflating the row count while
 * contributing nothing to coverage.
 */
export async function updateTopic(
  userId: string,
  update: TopicUpdate,
): Promise<UpdateResult> {
  await ensureSchema();

  if (!allTopicKeys().has(update.key)) {
    return { ok: false, error: `Unknown topic key: ${update.key}` };
  }
  const to = update.state as TopicStateName;
  if (!TOPIC_STATES.includes(to)) {
    return { ok: false, error: `Unknown topic state: ${update.state}` };
  }

  const db = requireDb();
  const existing = await withRetry(() =>
    db
      .select()
      .from(topicState)
      .where(sql`${topicState.userId} = ${userId} AND ${topicState.key} = ${update.key}`)
      .limit(1),
  );
  const from = (existing[0]?.state ?? "unseen") as TopicStateName;
  const gate = canTransitionTopic(from, to);
  if (!gate.ok) return { ok: false, error: gate.reason };

  // Crossing into a tested state counts as a cold retrieval.
  const testing = to === "self-tested" || to === "exam-ready";

  await withRetry(() =>
    db
      .insert(topicState)
      .values({
        userId,
        key: update.key,
        state: to,
        errorReason: update.errorReason ?? existing[0]?.errorReason ?? null,
        lastTestedAt: testing ? new Date() : existing[0]?.lastTestedAt ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [topicState.userId, topicState.key],
        set: {
          state: to,
          errorReason: update.errorReason ?? existing[0]?.errorReason ?? null,
          lastTestedAt: testing ? new Date() : existing[0]?.lastTestedAt ?? null,
          updatedAt: new Date(),
        },
      }),
  );
  return { ok: true };
}

export async function updateProblem(
  userId: string,
  update: ProblemUpdate,
): Promise<UpdateResult> {
  await ensureSchema();

  if (!allProblemKeys().has(update.key)) {
    return { ok: false, error: `Unknown problem key: ${update.key}` };
  }
  const to = update.state as ProblemStateName;
  if (!PROBLEM_STATES.includes(to)) {
    return { ok: false, error: `Unknown problem state: ${update.state}` };
  }

  const db = requireDb();
  const existing = await withRetry(() =>
    db
      .select()
      .from(problemState)
      .where(
        sql`${problemState.userId} = ${userId} AND ${problemState.key} = ${update.key}`,
      )
      .limit(1),
  );
  const prev = existing[0];
  const from = (prev?.state ?? "unseen") as ProblemStateName;
  const hintLevel = update.hintLevel ?? prev?.hintLevel ?? 0;

  const gate = canTransitionProblem(from, to);
  if (!gate.ok) return { ok: false, error: gate.reason };

  const budget = hintBudgetAllows(to, hintLevel);
  if (!budget.ok) return { ok: false, error: budget.reason };

  const now = new Date();
  await withRetry(() =>
    db
      .insert(problemState)
      .values({
        userId,
        key: update.key,
        state: to,
        hintLevel,
        errorReason: update.errorReason ?? prev?.errorReason ?? null,
        attempts: (prev?.attempts ?? 0) + (to === "understood" ? 1 : 0),
        coldSolvedAt: to === "solved-cold" ? now : prev?.coldSolvedAt ?? null,
        examSpeedAt: to === "exam-speed" ? now : prev?.examSpeedAt ?? null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [problemState.userId, problemState.key],
        set: {
          state: to,
          hintLevel,
          errorReason: update.errorReason ?? prev?.errorReason ?? null,
          attempts: (prev?.attempts ?? 0) + (to === "understood" ? 1 : 0),
          coldSolvedAt: to === "solved-cold" ? now : prev?.coldSolvedAt ?? null,
          examSpeedAt: to === "exam-speed" ? now : prev?.examSpeedAt ?? null,
          updatedAt: now,
        },
      }),
  );
  return { ok: true };
}
