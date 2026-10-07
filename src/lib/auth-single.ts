/**
 * Single-user auth — the no-database path.
 *
 * WHY THIS EXISTS
 * Neon is a hard dependency in the default path. If the database is
 * unreachable, paused past recovery, or over quota, the whole vault 500s and
 * the tracker becomes unusable. For a single-user vault that is a bad trade:
 * the notes are static files and need no database at all.
 *
 * Set `AUTH_MODE=single-user` and the vault runs with:
 *   - credentials from environment variables (never hardcoded in the repo),
 *   - a signed, httpOnly session cookie verified with Web Crypto,
 *   - zero database calls.
 *
 * WHAT YOU LOSE, DELIBERATELY
 * Tracker state needs somewhere to live. With no database it lives in
 * localStorage, which means:
 *   - state is per-browser, not per-account;
 *   - clearing site data, or switching device, loses it;
 *   - it cannot be read back on a different phone.
 * The tracker UI says this on screen rather than silently behaving as though
 * progress were durable. If that trade is wrong for you, keep the database and
 * set AUTH_MODE=database (the default).
 *
 * SECURITY NOTES
 * The password is read from `VAULT_PASSWORD` and compared with a constant-time
 * comparison. It is deliberately NOT defaulted to a value in this file: a
 * hardcoded credential in a git repo is a credential in every clone of it, and
 * this repo has a GitHub remote.
 */

import { env } from "./env";

const COOKIE = "mv_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function isSingleUser(): boolean {
  return env("AUTH_MODE") === "single-user";
}

/**
 * Tracker state lives in the browser rather than the database when this is true.
 * Pages use it to skip the DB read entirely rather than catching its failure.
 */
export function trackerIsLocal(): boolean {
  return isSingleUser();
}

export function vaultUsername(): string {
  return env("VAULT_USERNAME") || "owner";
}

/** Throws with a clear message rather than silently accepting an empty password. */
function expectedPassword(): string {
  const pw = env("VAULT_PASSWORD");
  if (!pw) {
    throw new Error(
      "AUTH_MODE=single-user requires VAULT_PASSWORD to be set. " +
        "Refusing to start with an empty password.",
    );
  }
  return pw;
}

/** Length-independent comparison, so timing does not leak the password. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do the work, so a length mismatch is not obviously faster.
    let sink = 0;
    for (let i = 0; i < b.length; i++) sink ^= a.charCodeAt(i) || 0;
    return sink === -1;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function checkCredentials(username: string, password: string): boolean {
  const userOk = timingSafeEqual(username, vaultUsername());
  const passOk = timingSafeEqual(password, expectedPassword());
  return userOk && passOk;
}

/* ------------------------------------------------------------------ cookies */

function b64url(bytes: Uint8Array): string {
  // Index loop rather than `for..of`: a Uint8Array is not downlevel-iterable
  // under this tsconfig, and spreading it allocates a second copy.
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Web Crypto wants a BufferSource backed by a plain ArrayBuffer. */
function asBufferSource(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy.buffer;
}

function fromB64url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(): Promise<CryptoKey> {
  const secret = env("BETTER_AUTH_SECRET");
  if (!secret) {
    throw new Error(
      "AUTH_MODE=single-user requires BETTER_AUTH_SECRET to sign the session cookie.",
    );
  }
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(username: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ u: username, exp })));
  const key = await hmacKey();
  const sig = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      asBufferSource(new TextEncoder().encode(payload)),
    ),
  );
  return `${payload}.${b64url(sig)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  try {
    const key = await hmacKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      asBufferSource(fromB64url(sig)),
      asBufferSource(new TextEncoder().encode(payload)),
    );
    if (!valid) return null;
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as {
      u: string;
      exp: number;
    };
    if (typeof data.exp !== "number" || data.exp * 1000 < Date.now()) return null;
    return data.u ?? null;
  } catch {
    return null;
  }
}

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export function sessionCookie(token: string): string {
  return [
    `${COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ].join("; ");
}

export function clearCookie(): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export const SESSION_COOKIE = COOKIE;

/**
 * Same shape as the AuthUser that layouts and pages already consume, so the
 * pages do not branch on auth mode for anything except the user's own name.
 */
export async function singleUserSession(request: Request): Promise<{
  user: { id: string; username: string; name: string; role: "admin"; status: string };
} | null> {
  const username = await verifySessionToken(readCookie(request, COOKIE));
  if (!username) return null;
  return {
    user: {
      id: "single-user",
      username,
      name: username,
      role: "admin",
      status: "approved",
    },
  };
}
