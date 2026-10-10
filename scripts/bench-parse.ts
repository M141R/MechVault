import { readFileSync } from "node:fs";
import { join } from "node:path";
import { splitSubject } from "../src/lib/subject-split";

const dir = join(process.cwd(), "src", "content");
const slugs = ["fm", "som", "thermo", "materials", "manufacturing", "numerical"];
const raws: Record<string, string> = {};
for (const s of slugs) raws[s] = readFileSync(join(dir, `${s}.html`), "utf8");

let t0 = performance.now();
const results: Record<string, number> = {};
for (const [k, raw] of Object.entries(raws)) {
  const s = performance.now();
  splitSubject(raw);
  results[k] = Math.round(performance.now() - s);
}
const total = Math.round(performance.now() - t0);
console.log("per-subject parse ms:", JSON.stringify(results));
console.log("ALL-6 cold-start parse total:", total, "ms");

t0 = performance.now();
splitSubject(raws.fm);
console.log("single-subject (fm) parse:", Math.round(performance.now() - t0), "ms");
