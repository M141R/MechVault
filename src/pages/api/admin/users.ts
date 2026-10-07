import { getSessionSafe, type AuthUser } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { user } from "../../../schema";
import { desc, eq } from "drizzle-orm";
import type { APIRoute } from "astro";

async function requireAdmin(request: Request): Promise<string | null> {
  const session = await getSessionSafe(request.headers);
  if (!session) return null;
  const u = session.user as AuthUser;
  return u.role === "admin" ? u.id : null;
}

export const GET: APIRoute = async ({ request }) => {
  if (!(await requireAdmin(request))) {
    return new Response("forbidden", { status: 403 });
  }
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      status: user.status,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));
  return new Response(JSON.stringify(users), {
    headers: { "content-type": "application/json" },
  });
};

/**
 * Delete an account. `topic_state` / `problem_state` rows reference
 * `user.id` ON DELETE CASCADE, so the tracker state goes with the account and
 * cannot be left orphaned.
 */
export const DELETE: APIRoute = async ({ request }) => {
  const adminId = await requireAdmin(request);
  if (!adminId) return new Response("forbidden", { status: 403 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return new Response("missing id", { status: 400 });

  // Guard against an admin deleting themselves and locking the vault.
  if (id === adminId) {
    return new Response("cannot delete your own admin account", { status: 400 });
  }

  await db.delete(user).where(eq(user.id, id));
  return new Response(JSON.stringify({ ok: true, deleted: id }), {
    headers: { "content-type": "application/json" },
  });
};

/**
 * Set a user's status/role. Kept for restoring an account that was made
 * read-only, now that approval is no longer required for normal access.
 */
export const PATCH: APIRoute = async ({ request }) => {
  if (!(await requireAdmin(request))) {
    return new Response("forbidden", { status: 403 });
  }
  const params = new URL(request.url).searchParams;
  const id = params.get("id");
  const role = params.get("role");
  if (!id || (role !== "admin" && role !== "user")) {
    return new Response("missing id or invalid role", { status: 400 });
  }
  await db.update(user).set({ role }).where(eq(user.id, id));
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
};
