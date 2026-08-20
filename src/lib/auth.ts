import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username, admin } from "better-auth/plugins";
import { and, eq, ne } from "drizzle-orm";
import { db, withRetry } from "./db";
import { env } from "./env";
import * as schema from "../schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
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
        defaultValue: "pending",
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
            db
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
});

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
