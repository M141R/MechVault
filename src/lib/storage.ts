import { readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { env } from "./env";

export const ALLOWED_PREFIXES = ["images", "books", "syllabus"];

// Repo root: at build time import.meta.url points at the bundle, so prefer
// process.cwd(), which is the project root in dev and the function's working
// directory (containing the uploaded project files) on Vercel.
const projectRoot =
  process.cwd() || fileURLToPath(new URL("../..", import.meta.url));

let s3: S3Client | null = null;
function getS3(): S3Client | null {
  const account = env("R2_ACCOUNT_ID");
  const key = env("R2_ACCESS_KEY_ID");
  const secret = env("R2_SECRET_ACCESS_KEY");
  if (!account || !key || !secret) return null;
  if (!s3) {
    s3 = new S3Client({
      region: "auto",
      endpoint: `https://${account}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: key, secretAccessKey: secret },
    });
  }
  return s3;
}

const BUCKET = env("R2_BUCKET");

export interface FileResult {
  stream: ReadableStream | null;
  size: number;
}

/** Returns a web stream for the file, reading from R2 in prod and the
 *  local filesystem (dev, or when the object lives in the repo instead of R2). */
export async function getFileStream(path: string): Promise<FileResult | null> {
  const client = getS3();

  if (client && BUCKET) {
    try {
      const head = await client.send(
        new HeadObjectCommand({ Bucket: BUCKET, Key: path })
      );
      const get = await client.send(
        new GetObjectCommand({ Bucket: BUCKET, Key: path })
      );
      const size = Number(get.ContentLength ?? head.ContentLength ?? 0);
      const body = get.Body;
      if (!body) return null;
      // S3 returns a Node Readable on Node runtime; convert to web stream.
      const stream = body as unknown as import("node:stream").Readable;
      const web = new ReadableStream({
        start(controller) {
          stream.on("data", (chunk) => controller.enqueue(chunk));
          stream.on("end", () => controller.close());
          stream.on("error", (err) => controller.error(err));
        },
        cancel() {
          stream.destroy();
        },
      });
      return { stream: web, size };
    } catch (e) {
      // Object missing from R2: fall through to the repo filesystem.
      const status = (e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (status !== 404) throw e;
    }
  }

  // Local fallback (dev, or repo-shipped objects like PYQ images): serve from
  // the repo folders, which Vercel includes in the function unless ignored.
  const local = join(projectRoot, ...path.split("/"));
  try {
    const info = await stat(local);
    const buf = await readFile(local);
    const web = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(buf));
        controller.close();
      },
    });
    return { stream: web, size: info.size };
  } catch {
    return null;
  }
}

export { createReadStream };
