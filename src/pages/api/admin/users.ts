import { getSessionSafe, type AuthUser } from "../../../lib/auth";
import { requireDb } from "../../../lib/db";
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
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }
  try {
    const db = requireDb();
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
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
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

  const db = requireDb();
  await db.delete(user).where(eq(user.id, id));
  return new Response(JSON.stringify({ ok: true, deleted: id }), {
    headers: { "content-type": "application/json" },
  });
};

/**
 * Set a user's role. Accepts JSON body { id, role } (preferred) or query
 * params ?id=&role= for backwards compatibility.
 */
export const PATCH: APIRoute = async ({ request }) => {
  const adminId = await requireAdmin(request);
  if (!adminId) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }
  let id: string | null = null;
  let role: string | null = null;
  const ctype = request.headers.get("content-type") ?? "";
  if (ctype.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as {
      id?: unknown;
      role?: unknown;
    } | null;
    if (typeof body?.id === "string") id = body.id;
    if (typeof body?.role === "string") role = body.role;
  }
  if (!id || !role) {
    const params = new URL(request.url).searchParams;
    id = id ?? params.get("id");
    role = role ?? params.get("role");
  }
  if (!id || (role !== "admin" && role !== "user")) {
    return new Response(JSON.stringify({ error: "missing id or invalid role" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  // An admin must not demote themselves out of the admin set.
  if (id === adminId && role !== "admin") {
    return new Response(JSON.stringify({ error: "cannot demote your own admin account" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  try {
    const db = requireDb();
    const updated = await db.update(user).set({ role }).where(eq(user.id, id)).returning({ id: user.id });
    if (!updated.length) {
      return new Response(JSON.stringify({ error: "user not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};
