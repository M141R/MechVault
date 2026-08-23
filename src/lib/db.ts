import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import * as schema from "../schema";
import { env } from "./env";

// Increase fetch timeout for Neon cold-starts (DB may be paused on free tier)
neonConfig.fetchConnectionCache = true;
neonConfig.pipelineConnect = true;

const connectionString = env("DATABASE_URL");

// Add connection timeout for Neon cold-starts (free tier pauses after 5 min inactivity)
const sql = neon(connectionString, {
  connectionTimeout: 30000, // 30 seconds for DB wake-up
  pipelineTLS: true,
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