import { getSessionSafe, type AuthUser } from "../../../lib/auth";
import { requireDb } from "../../../lib/db";
import { user } from "../../../schema";
import { eq } from "drizzle-orm";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  const session = await getSessionSafe(request.headers);
  if (!session || (session.user as AuthUser).role !== "admin") {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) {
        return new Response(JSON.stringify({ error: "cross-origin write blocked" }), {
          status: 403,
          headers: { "content-type": "application/json" },
        });
      }
    } catch {
      return new Response(JSON.stringify({ error: "bad origin" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.userId !== "string" || !body.userId) {
    return new Response(JSON.stringify({ error: "userId is required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const ALLOWED = new Set(["approved", "pending", "rejected"]);
  if (typeof body.status !== "string" || !ALLOWED.has(body.status)) {
    return new Response(
      JSON.stringify({ error: "status must be one of approved, pending, rejected" }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }
  const status: string = body.status;

  try {
    const db = requireDb();
    const updated = await db.update(user).set({ status }).where(eq(user.id, body.userId)).returning({ id: user.id });
    if (!updated.length) {
      return new Response(JSON.stringify({ error: "user not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};
