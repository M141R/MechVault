import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import * as schema from "../schema";
import { env } from "./env";

/**
 * Neon free-tier pauses the compute after a few minutes of inactivity, so the
 * first query of a session pays a wake-up cost. Three settings address it.
 *
 * Note the option shapes, which the type definitions are strict about:
 *   - `pipelineConnect` is a NeonConfig GLOBAL and takes 'password' | false,
 *     never `true`.
 *   - the per-query timeout is `fetchOptions.connectionTimeoutMillis`;
 *     there is no top-level `connectionTimeout` option.
 * Passing the old names silently type-errored and was ignored at runtime.
 */
neonConfig.fetchConnectionCache = true;
neonConfig.pipelineConnect = "password";

const connectionString = env("DATABASE_URL");

/**
 * `AUTH_MODE=single-user` (see auth-single.ts) is the documented no-database
 * path: the notes are static files, tracker state lives in the browser, and
 * no query is ever issued.
 *
 * This guard used to throw unconditionally when DATABASE_URL was absent, and
 * its own error message told the operator to set AUTH_MODE=single-user. But
 * because `db.ts` is imported at module scope by anything that touches the DB
 * (middleware, the tracker API, the admin routes), setting that flag still
 * crashed at import time -- the advice could never actually be followed. The
 * result was an unreachable no-database mode and a misleading 500 on every
 * route, including /login, which needs no database at all.
 *
 * In single-user mode `db` stays null instead. Callers that genuinely need the
 * database must ask for it explicitly (see `requireDb`) so a missing connection
 * string fails at the point of use with an accurate message, rather than
 * poisoning every import of this module.
 */
export const db = (() => {
  if (!connectionString) {
    if (env("AUTH_MODE") === "single-user") return null;
    throw new Error(
      "DATABASE_URL is not set. Add it to the deployment environment, or run " +
        "with AUTH_MODE=single-user to serve the vault without a database.",
    );
  }
  const sql = neon(connectionString, {
    // 30s to absorb a paused-cluster wake-up; the default is far shorter and
    // fails the request mid-wake.
    fetchOptions: { connectionTimeoutMillis: 30000 },
  });
  return drizzle(sql, { schema });
})();

/**
 * Narrowing accessor for code paths that cannot work without the database.
 * Throws where the omission actually matters, naming the real cause.
 */
export function requireDb() {
  if (!db) {
    throw new Error(
      "This feature needs DATABASE_URL, which is not set. The vault is " +
        "running in AUTH_MODE=single-user, which stores tracker state in the " +
        "browser and cannot serve admin or account routes.",
    );
  }
  return db;
}

/** Retry a DB-backed operation to ride out Neon cold-starts. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { tries = 4, baseDelay = 1200 }: { tries?: number; baseDelay?: number } = {},
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const delay = baseDelay * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}