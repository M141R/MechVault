import { getSessionSafe, type AuthUser } from "./lib/auth";
import { defineMiddleware } from "astro:middleware";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/pending",
  "/api/auth",
  "/_astro",
  "/assets",
  "/search-index.json",
  "/favicon",
];

function isPublic(pathname: string) {
  if (pathname === "/") return false;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Assets, auth endpoints and public pages never touch the database, so they
  // load instantly even while Neon is cold-starting.
  if (isPublic(pathname)) return next();

  const session = await getSessionSafe(context.request.headers);
  const user = (session?.user ?? null) as AuthUser | null;
  context.locals.user = user;
  context.locals.session = session?.session ?? null;

  // /api/file does its own approved-check but must at least be logged in.
  if (pathname === "/api/file") {
    if (!user) return json(401, { error: "unauthorized" });
    return next();
  }

  // Other API routes: require session.
  if (pathname.startsWith("/api/")) {
    if (!user) return json(401, { error: "unauthorized" });
    return next();
  }

  // Page routes below here require an approved account.
  if (!user) {
    return context.redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }

  if (user.status !== "approved") {
    if (pathname === "/pending" || pathname === "/logout") return next();
    return context.redirect("/pending");
  }

  // Admin area.
  if (pathname.startsWith("/admin") && user.role !== "admin") {
    return context.redirect("/");
  }

  return next();
});
