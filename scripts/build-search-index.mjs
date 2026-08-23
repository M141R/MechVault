import { parseFragment, serialize } from "parse5";
import { readFileSync, writeFileSync } from "node:fs";

const SLUGS = {
  fm: "Fluid Mechanics",
  som: "Strength of Materials",
  thermo: "Thermodynamics",
  materials: "Materials Engineering",
  manufacturing: "Manufacturing Processes",
  numerical: "Numerical Methods",
};

function isEl(n) {
  return n && n.nodeName && n.tagName;
}
function getAttr(n, name) {
  if (!n.attrs) return null;
  for (const a of n.attrs) if (a.name === name) return a.value;
  return null;
}
function hasClass(n, cls) {
  const c = getAttr(n, "class");
  return !!c && c.split(/\s+/).includes(cls);
}
function text(n) {
  if (n.nodeName === "#text") return n.value || "";
  if (n.childNodes) return n.childNodes.map(text).join("");
  return "";
}
function stripTags(htmlStr) {
  return htmlStr
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/\s+/g, " ")
    .trim();
}
function findEl(node, pred) {
  if (!node) return null;
  if (pred(node)) return node;
  if (node.childNodes) {
    for (const c of node.childNodes) {
      const r = findEl(c, pred);
      if (r) return r;
    }
  }
  return null;
}
function findEls(node, pred, out = []) {
  if (!node) return out;
  if (pred(node)) out.push(node);
  if (node.childNodes) for (const c of node.childNodes) findEls(c, pred, out);
  return out;
}

function split(raw) {
  const frag = parseFragment(raw);
  const notesMain = findEl(frag, (n) => isEl(n) && hasClass(n, "notes-main"));
  const modules = [];
  if (notesMain) {
    for (const c of notesMain.childNodes ?? []) {
      if (!isEl(c)) continue;
      if (hasClass(c, "module-block")) {
        const head = findEl(c, (n) => isEl(n) && hasClass(n, "module-head"));
        const chip = head ? findEl(head, (n) => isEl(n) && hasClass(n, "mchip")) : null;
        const h3 = head ? findEl(head, (n) => isEl(n) && n.tagName === "h3") : null;
        const toc = findEl(c, (n) => isEl(n) && n.tagName === "nav" && hasClass(n, "toc"));
        const topics = [];
        if (toc) {
          for (const a of findEls(toc, (n) => isEl(n) && n.tagName === "a")) {
            const href = getAttr(a, "href") || "";
            topics.push({ id: href.replace(/^#/, ""), label: text(a).trim() });
          }
        }
        const id = chip ? parseInt(text(chip).replace(/\D/g, ""), 10) : null;
        if (id === null) continue;
        modules.push({ id, title: h3 ? text(h3).trim() : `Module ${id}`, topics, node: c });
      }
    }
  }
  return modules;
}

const entries = [];
entries.push({
  t: "MechVault — 3rd Semester Study Hub",
  s: "Home",
  u: "/",
  a: "",
  b: "MechVault — BIT Mesra ME 3rd semester study hub for Fluid Mechanics, Strength of Materials and Thermodynamics.",
});

for (const [slug, subj] of Object.entries(SLUGS)) {
  const raw = readFileSync(`src/content/${slug}.html`, "utf8");
  const modules = split(raw);

  for (const [sec, label] of [
    ["syllabus", "Syllabus"],
    ["cheat", "Cheat Sheet"],
    ["pyqs", "Previous Year Papers"],
  ]) {
    if (raw.includes(`id="${sec}"`)) {
      entries.push({
        t: `${subj} — ${label}`,
        s: `${subj} · ${label}`,
        u: `/${slug}`,
        a: sec,
        b: `${label} for ${subj} (BIT Mesra 3rd semester, MO 2022–2025).`,
      });
    }
  }

  for (const m of modules) {
    const html = serialize(m.node);
    entries.push({
      t: m.title,
      s: `${subj} · Module ${m.id}`,
      u: `/${slug}/module/${m.id}`,
      a: "",
      b: stripTags(html).slice(0, 180),
    });
    for (const t of m.topics) {
      const topicNode = findEl(m.node, (n) => isEl(n) && getAttr(n, "id") === t.id);
      const snippet = topicNode ? stripTags(serialize(topicNode)).slice(0, 180) : "";
      entries.push({
        t: t.label,
        s: `${subj} · Module ${m.id}`,
        u: `/${slug}/module/${m.id}`,
        a: t.id,
        b: snippet,
      });
    }
  }
}

writeFileSync("public/search-index.json", JSON.stringify(entries, null, 1) + "\n");
console.log(`Wrote ${entries.length} entries to public/search-index.json`);