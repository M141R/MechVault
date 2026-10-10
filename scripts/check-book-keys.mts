/**
 * Regression test for the textbook-problem checkbox.
 *
 * BUG THIS GUARDS
 * Ticking a textbook row failed with `Unknown problem key: bq.fm.m1.1.1`.
 * `allProblemKeys()` enumerated only the hand-written `problems` arrays in
 * config.ts, so none of the 781 generated book keys were valid — and the
 * checkbox silently reverted.
 *
 * Run: npx tsx scripts/check-book-keys.mts
 */
import { allProblemKeys } from "../src/lib/tracker/config";
import { allBookProblemKeys, bookProblemKey, BOOK_BANK } from "../src/lib/tracker/book-bank";

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

const valid = allProblemKeys();
const bookKeys = allBookProblemKeys();

// 1. The exact key from the bug report.
const reported = "bq.fm.m1.1.1";
check("reported failing key is accepted", valid.has(reported));

// 2. Every generated book key is valid, for every subject.
let missing: string[] = [];
for (const k of bookKeys) if (!valid.has(k)) missing.push(k);
check(
  `all ${bookKeys.size} book keys are accepted`,
  missing.length === 0,
  missing.length ? `${missing.length} rejected, first: ${missing[0]}` : "",
);

// 3. Book keys never collide with config problem keys.
const configKeys = new Set<string>();
const { TRACKER } = await import("../src/lib/tracker/config");
for (const c of Object.values(TRACKER)) for (const p of c.problems) configKeys.add(p.key);
const collisions = [...bookKeys].filter((k) => configKeys.has(k));
check(
  "no collision with config problem keys",
  collisions.length === 0,
  collisions.length ? `collide: ${collisions.slice(0, 3).join(", ")}` : "",
);

// 4. A key built by the page matches a key built by the store, for every
//    question in the bank. This is the copy-paste drift that caused the bug.
let drift: string[] = [];
for (const [slug, subject] of Object.entries(BOOK_BANK)) {
  for (const q of subject.questions ?? []) {
    const k = bookProblemKey(slug, q);
    if (!valid.has(k)) drift.push(k);
  }
}
check(
  "page-side key builder agrees with the store for every question",
  drift.length === 0,
  drift.length ? `${drift.length} drifted, first: ${drift[0]}` : "",
);

// 5. Every subject that renders rows has at least one accepted key.
for (const [slug, subject] of Object.entries(BOOK_BANK)) {
  const n = (subject.questions ?? []).length;
  if (n === 0) continue;
  const sample = bookProblemKey(slug, subject.questions[0]);
  check(`${slug}: sample key valid (${n} questions)`, valid.has(sample), sample);
}

console.log(failures === 0 ? "\nall checks passed" : `\n${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);