import { auth } from "../../../lib/auth";
import { withRetry } from "../../../lib/db";
import type { APIRoute } from "astro";

async function handle(request: Request): Promise<Response> {
  return withRetry(() => auth.handler(request), { tries: 3, baseDelay: 600 });
}

export const ALL: APIRoute = (ctx) => handle(ctx.request);
export const GET: APIRoute = (ctx) => handle(ctx.request);
export const POST: APIRoute = (ctx) => handle(ctx.request);
