import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../schema";
import { env } from "./env";

const connectionString = env("DATABASE_URL");

const sql = neon(connectionString);
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