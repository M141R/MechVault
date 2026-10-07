import type { APIRoute } from "astro";
import {
  isSingleUser,
  checkCredentials,
  createSessionToken,
  sessionCookie,
  clearCookie,
} from "../../lib/auth-single";

/**
 * Single-user login. Only mounted in behaviour when AUTH_MODE=***
 * In database mode this endpoint reports that it is inactive, so an accidental
 * deployment of both cannot create a second, weaker way in.
 */
export const POST: APIRoute = async ({ request }) => {
  if (!isSingleUser()) {
    return new Response(JSON.stringify({ error: "single-user auth is not enabled" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  let username = "";
  let password = "";
  const ctype = request.headers.get("content-type") ?? "";

  if (ctype.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as {
      username?: string;
      password?: string;
      next?: string;
    };
    username = String(body.username ?? "");
    password = String(body.password ?? "");
    var next = String(body.next ?? "/");
  } else {
    const form = await request.formData();
    username = String(form.get("username") ?? "");
    password = String(form.get("password") ?? "");
    var next = String(form.get("next") ?? "/");
  }

  // Open-redirect guard: only same-origin relative paths.
  if (!next.startsWith("/") || next.startsWith("//")) next = "/";

  if (!checkCredentials(username, password)) {
    // Deliberately vague: do not reveal which field was wrong.
    return new Response(
      JSON.stringify({ error: "Incorrect username or password." }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }

  const token = await createSessionToken(username);
  return new Response(JSON.stringify({ ok: true, next }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": sessionCookie(token),
    },
  });
};

/** Sign out. */
export const DELETE: APIRoute = async () => {
  if (!isSingleUser()) {
    return new Response(JSON.stringify({ error: "single-user auth is not enabled" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json", "set-cookie": clearCookie() },
  });
};
