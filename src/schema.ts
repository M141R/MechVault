import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  username: text("username").unique(),
  displayUsername: text("display_username").unique(),
  role: text("role").notNull().default("user"),
  banned: boolean("banned").notNull().default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  status: text("status").notNull().default("pending"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
});

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    issuer: text("issuer"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/** ---------------------------------------------------------------------------
 * TRACKER STATE
 *
 * Design note: the *content* of the tracker (topics, problems, decks) lives in
 * `src/lib/tracker/config.ts` — a plain data file the user can edit. The
 * database stores only *state*: which topics/problems a given user has taken
 * to which stage. Two consequences:
 *
 *   1. Adding a topic = edit one array in one config file. No migration.
 *   2. The key is a human-readable string (`fm.m2.t3`), not a generated id, so
 *      state survives renumbering of everything else.
 *
 * Two independent state machines, because a syllabus topic and a numerical
 * problem are not the same kind of object:
 *
 *   TOPIC   unseen -> read -> rederived -> self-tested -> exam-ready | flaky
 *           (recall subjects: `rederived` reads as `recalled`)
 *   PROBLEM unseen -> attempted-fail -> understood -> solved-cold -> exam-speed
 *
 * The hard gate: TOPIC `self-tested` requires `rederived` first. Reading is not
 * mastery, and `read -> self-tested` is exactly the shortcut that produced the
 * Fluid midsem result.
 * ------------------------------------------------------------------------- */

export const topicState = pgTable(
  "topic_state",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Matches `key` in the tracker config, e.g. `fm.m2.t3`. */
    key: text("key").notNull(),
    state: text("state").notNull().default("unseen"),
    /** Optional: where it broke, in the user's own words. Error log. */
    errorReason: text("error_reason"),
    /** When the item was last retrieved cold (not re-read). */
    lastTestedAt: timestamp("last_tested_at"),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.key] }),
    index("topic_state_user_idx").on(t.userId),
  ],
);

export const problemState = pgTable(
  "problem_state",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    state: text("state").notNull().default("unseen"),
    /**
     * How many AI hints were consumed to get unstuck. 0 means solved with no
     * help at all — the only outcome that counts as evidence. Mirrored from
     * the Vikunja hint-ladder rule so the two systems cannot disagree.
     */
    hintLevel: integer("hint_level").notNull().default(0),
    /** Structured reason this attempt failed — drives the Friday audit. */
    errorReason: text("error_reason"),
    attempts: integer("attempts").notNull().default(0),
    /** Solved from a blank page, no notes, no AI. */
    coldSolvedAt: timestamp("cold_solved_at"),
    /** Solved within exam time budget. */
    examSpeedAt: timestamp("exam_speed_at"),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.key] }),
    index("problem_state_user_idx").on(t.userId),
  ],
);

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type TopicState = typeof topicState.$inferSelect;
export type ProblemState = typeof problemState.$inferSelect;
