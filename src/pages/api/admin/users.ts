import { getSessionSafe, type AuthUser } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { user } from "../../../schema";
import { desc } from "drizzle-orm";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  const session = await getSessionSafe(request.headers);
  if (!session || (session.user as AuthUser).role !== "admin") {
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
