import { getSessionSafe as dbSessionSafe, type AuthUser } from "./lib/auth";
import { isSingleUser, singleUserSession } from "./lib/auth-single";
import { defineMiddleware } from "astro:middleware";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/pending",
  "/api/auth",
  "/api/single-login",
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

/** Session lookup for whichever auth mode is active. */
async function resolveSession(request: Request): Promise<AuthUser | null> {
  if (isSingleUser()) {
    const s = await singleUserSession(request);
    // Structurally identical to the better-auth user; cast through the one
    // field the rest of the app reads.
    return (s?.user ?? null) as AuthUser | null;
  }
  const session = await dbSessionSafe(request.headers);
  return (session?.user ?? null) as AuthUser | null;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Assets, auth endpoints and public pages never touch the database, so they
  // load instantly even while Neon is cold-starting.
  if (isPublic(pathname)) return next();

  let user: AuthUser | null = null;
  try {
    user = await resolveSession(context.request);
  } catch (e) {
    // A dead database must not take the vault down with it. In single-user mode
    // there is no database to be dead; in DB mode, a failure here means the
    // session cannot be verified, so treat it as signed out rather than 500.
    console.error("[auth] session lookup failed:", (e as Error).message);
    user = null;
  }
  context.locals.user = user;
  context.locals.session = null;

  // Banned accounts lose access everywhere, including files and APIs.
  const banned =
    (user as unknown as { banned?: boolean } | null)?.banned === true;
  if (banned) {
    if (pathname.startsWith("/api/")) return json(403, { error: "account disabled" });
    return context.redirect("/login?banned=1");
  }

  // In single-user mode there are no accounts to create and no pending queue.
  // Keep /register and /pending from rendering dead forms.
  if (isSingleUser() && (pathname === "/register" || pathname === "/pending")) {
    return context.redirect("/login");
  }

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

  // Page routes below here require a login.
  if (!user) {
    return context.redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }

  // The approval gate was removed deliberately: MechVault is a single-user
  // private vault, and a second gate only meant that a legitimate extra login
  // (a new device, a fresh browser profile) silently read 0% instead of the
  // real state. Access control is the login itself.

  // Admin area.
  if (pathname.startsWith("/admin") && user.role !== "admin") {
    return context.redirect("/");
  }

  return next();
});
