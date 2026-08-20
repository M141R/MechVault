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
  const session = await getSessionSafe(request.headers);
  if (!session) {
    return new Response("unauthorized", { status: 401 });
  }
  const user = session.user as AuthUser;
  if (user.status !== "approved") {
    return new Response("pending approval", { status: 403 });
  }

  const raw = url.searchParams.get("path") || "";
  const decoded = decodeURIComponent(raw);
  const path = decoded.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!path || path.includes("..")) {
    return new Response("invalid path", { status: 400 });
  }
  const prefix = ALLOWED_PREFIXES.find((p) => path.startsWith(p + "/"));
  if (!prefix) {
    return new Response("invalid path", { status: 400 });
  }

  const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
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
