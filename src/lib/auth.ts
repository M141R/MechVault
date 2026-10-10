import { betterAuth } from "better-auth";
import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username, admin } from "better-auth/plugins";
import { and, eq, ne } from "drizzle-orm";
import { requireDb, withRetry } from "./db";
import { env } from "./env";
import * as schema from "../schema";

/**
 * The Better Auth instance, built lazily.
 *
 * It used to be a module-scope `const`, which meant merely importing this file
 * constructed a drizzle adapter and demanded DATABASE_URL -- even in
 * AUTH_MODE=***, where the whole point is that there is no database.
 * `getSessionSafe` is imported by middleware, the base layout, and most API
 * routes, so that eager construction took down every route in the app.
 *
 * A Proxy defers the real construction to first property access, so importing
 * is free and only genuine auth-database use pays the cost.
 */
let cached: ReturnType<typeof betterAuth> | null = null;

function buildAuth() {
  if (!cached) cached = betterAuth(makeConfig());
  return cached;
}

export const auth: ReturnType<typeof betterAuth> = new Proxy(
  {} as ReturnType<typeof betterAuth>,
  {
    get(_t, prop, receiver) {
      const real = buildAuth() as unknown as Record<string | symbol, unknown>;
      const value = real[prop];
      if (typeof value === "function") return (value as Function).bind(real);
      return value;
    },
    has(_t, prop) {
      return prop in (buildAuth() as unknown as object);
    },
  },
);

function makeConfig(): BetterAuthOptions {
  return {
  // `requireDb()` rather than `db`: the database-mode auth object is built at
  // module scope, and in AUTH_MODE=*** there is no database to bind.
  // Single-user deployments never reach this branch (see auth-single.ts), so
  // failing here names the real problem instead of a null deref.
  database: drizzleAdapter(requireDb(), {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: env("BETTER_AUTH_SECRET"),
  baseURL: env("BETTER_AUTH_URL") || "http://localhost:4321",
  trustedOrigins: [env("BETTER_AUTH_URL") || "http://localhost:4321"],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      status: {
        type: "string",
        required: false,
        input: false,
        // Accounts are usable the moment they are created — the approval gate
        // was removed. Existing rows keep whatever status they already had.
        defaultValue: "approved",
      },
    },
    modelName: "user",
  },
  databaseHooks: {
    session: {
      create: {
        after: async (newSession) => {
          // Single active session per user (last login wins): revoke every
          // other session the moment a new one is created. Skipped for admin
          // impersonation, which must not kick the impersonated user.
          if (newSession.impersonatedBy) return;
          await withRetry(() =>
            requireDb()
              .delete(schema.session)
              .where(
                and(
                  eq(schema.session.userId, newSession.userId),
                  ne(schema.session.id, newSession.id),
                ),
              ),
          );
        },
      },
    },
  },
  plugins: [
    username(),
    admin({
      adminRoles: ["admin"],
      defaultRole: "user",
      adminUserIds: (env("ADMIN_USER_IDS") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    }),
  ],
  };
}

export type Auth = typeof auth;

/** Session user augmented with our custom status/role columns. */
export type AuthUser = typeof auth.$Infer.Session.user & {
  status: string;
  role: string;
  username?: string | null;
};

/** Session lookup that retries through Neon cold-starts. */
export async function getSessionSafe(headers: Headers) {
  return withRetry(() => auth.api.getSession({ headers }), { tries: 4, baseDelay: 1200 });
}
