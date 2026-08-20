import "dotenv/config";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import * as schema from "../src/schema";

const conn = process.env.DATABASE_URL;
if (!conn) {
  console.error("DATABASE_URL not set.");
  process.exit(1);
}

const db = drizzle(neon(conn), { schema });

const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4321",
  emailAndPassword: { enabled: true },
  plugins: [username()],
});

const adminUsername = process.env.ADMIN_USERNAME || "admin";
const password = process.env.ADMIN_PASSWORD;
if (!password || password === "change-me") {
  console.error("Set ADMIN_PASSWORD in .env before seeding.");
  process.exit(1);
}

async function promote(uid: string) {
  await db
    .update(schema.user)
    .set({ status: "approved", role: "admin" })
    .where(eq(schema.user.id, uid));
  console.log(`Approved + promoted user to admin. id=${uid}`);
  console.log("Add this id to ADMIN_USER_IDS in your Vercel env (comma-separated).");
}

// If the username already exists (e.g. from a previous broken seed), remove it
// first so signUpEmail can write a fresh credential (password) row.
const existing = await db
  .select({ id: schema.user.id })
  .from(schema.user)
  .where(eq(schema.user.username, adminUsername));
for (const row of existing) {
  await db.delete(schema.user).where(eq(schema.user.id, row.id));
  console.log(`Removed stale user "${adminUsername}" (${row.id}).`);
}

const created = await auth.api.signUpEmail({
  body: {
    email: `${adminUsername}@mechvault.local`,
    name: "MechVault Admin",
    password,
    username: adminUsername,
  },
});
await promote(created.user.id);
