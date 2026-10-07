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
 * Hard-fails at import time with an actionable message instead of letting
 * `neon("")` produce an opaque DNS/connection failure at the first query.
 * `AUTH_MODE=single-user` (see auth-single.ts) is the no-database path.
 */
if (!connectionString) {
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

export const db = drizzle(sql, { schema });

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