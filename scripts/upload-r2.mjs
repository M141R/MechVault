import "dotenv/config";
import { readdirSync, statSync, createReadStream } from "node:fs";
import { join } from "node:path";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { readFile } from "node:fs/promises";

// Source dirs on disk -> key prefix in the bucket. Images live under
// public/images but are served as images/... (see storage.ts fallback), so the
// public/ prefix is stripped when computing the R2 key.
const SOURCES = [
  { dir: "books", prefix: "books" },
  { dir: "syllabus", prefix: "syllabus" },
  { dir: "images", prefix: "images" },
  { dir: "public/images", prefix: "images" },
];

const account = process.env.R2_ACCOUNT_ID;
const key = process.env.R2_ACCESS_KEY_ID;
const secret = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET;

if (!account || !key || !secret || !bucket) {
  console.error("R2 env vars missing (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET).");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${account}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: key, secretAccessKey: secret },
});

function walk(dir, base) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = join(base, entry).replace(/\\/g, "/");
    if (statSync(full).isDirectory()) out.push(...walk(full, rel));
    else out.push(rel);
  }
  return out;
}

async function fileExists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  let total = 0, uploaded = 0, skipped = 0;
  const onlyMissing = process.argv.includes("--missing");
  const seen = new Set();

  for (const { dir, prefix } of SOURCES) {
    if (!existsSyncSafe(dir)) {
      console.log(`skip ${dir} (not present)`);
      continue;
    }
    const files = walk(dir, prefix);
    console.log(`${dir} -> ${prefix}: ${files.length} files`);
    for (const rel of files) {
      // Dedupe: books/images may exist in both legacy and public/ locations.
      if (seen.has(rel)) {
        skipped++;
        continue;
      }
      seen.add(rel);
      total++;
      if (onlyMissing && (await fileExists(rel))) {
        skipped++;
        continue;
      }
      // Key is prefix-relative; local path is dir + remainder.
      const localRel = rel.slice(prefix.length).replace(/^\/+/, "");
      const localPath = join(process.cwd(), dir, ...localRel.split("/").filter(Boolean));
      const body = await readFile(localPath);
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: rel,
          Body: body,
        })
      );
      uploaded++;
      if (uploaded % 25 === 0) console.log(`  ${uploaded} uploaded…`);
    }
  }
  console.log(`\nDone. total=${total} uploaded=${uploaded} skipped=${skipped}`);
}

function existsSyncSafe(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});