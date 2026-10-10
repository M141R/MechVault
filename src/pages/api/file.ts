import { getSessionSafe, type AuthUser } from "../../lib/auth";
import { getFileStream, ALLOWED_PREFIXES } from "../../lib/storage";
import type { APIRoute } from "astro";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

export const GET: APIRoute = async ({ request, url }) => {
  const { isSingleUser, singleUserSession } = await import("../../lib/auth-single");
  let user: AuthUser | null = null;
  if (isSingleUser()) {
    const s = await singleUserSession(request);
    user = (s?.user ?? null) as unknown as AuthUser | null;
  } else {
    const session = await getSessionSafe(request.headers);
    if (!session) {
      return new Response("unauthorized", { status: 401 });
    }
    user = session.user as AuthUser;
  }
  if (!user) {
    return new Response("unauthorized", { status: 401 });
  }
  // Access control is the login itself (see middleware.ts). Legacy rows may
  // still carry status=pending; they must not 403 on files while pages load.
  // Banned accounts are blocked everywhere.
  if ((user as unknown as { banned?: boolean }).banned === true) {
    return new Response("account disabled", { status: 403 });
  }

  const raw = url.searchParams.get("path") || "";
  let decoded: string;
  try {
    // Decode twice to catch %252e-style double-encoding, then reject.
    decoded = decodeURIComponent(decodeURIComponent(raw));
  } catch {
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      return new Response("invalid path", { status: 400 });
    }
  }
  const path = decoded.replace(/\\/g, "/").replace(/^\/+/, "");
  const segments = path.split("/");
  if (!path || segments.includes("..") || segments.includes(".") || path.includes("..")) {
    return new Response("invalid path", { status: 400 });
  }
  const prefix = ALLOWED_PREFIXES.find((p) => path.startsWith(p + "/"));
  if (!prefix) {
    return new Response("invalid path", { status: 400 });
  }

  const dot = path.lastIndexOf(".");
  const ext = dot >= 0 ? path.slice(dot).toLowerCase() : "";
  const contentType = MIME[ext] || "application/octet-stream";

  const result = await getFileStream(path);
  if (!result) {
    return new Response("not found", { status: 404 });
  }

  return new Response(result.stream, {
    headers: {
      "content-type": contentType,
      "content-disposition": "inline",
      "content-length": String(result.size),
      "cache-control": "private, max-age=3600",
    },
  });
};
