import { getSessionSafe, type AuthUser } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { user } from "../../../schema";
import { eq } from "drizzle-orm";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  const session = await getSessionSafe(request.headers);
  if (!session || (session.user as AuthUser).role !== "admin") {
    return new Response("forbidden", { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.userId !== "string") {
    return new Response("bad request", { status: 400 });
  }
  const status = body.status === "approved" ? "approved" : "rejected";
  if (status !== "approved" && status !== "rejected") {
    return new Response("bad status", { status: 400 });
  }

  await db.update(user).set({ status }).where(eq(user.id, body.userId));
  return new Response("ok", { status: 200 });
};
