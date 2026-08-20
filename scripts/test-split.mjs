import { parseFragment, serialize } from "parse5";
import { readFileSync } from "node:fs";

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
function findById(node, id) {
  return findEl(node, (n) => isEl(n) && getAttr(n, "id") === id);
}

function splitSubject(raw) {
  const frag = parseFragment(raw);
  const pageHead = findEl(frag, (n) => isEl(n) && n.tagName === "section" && hasClass(n, "page-head"));
  const syllabus = findEl(frag, (n) => isEl(n) && n.tagName === "section" && getAttr(n, "id") === "syllabus");
  const notesMain = findEl(frag, (n) => isEl(n) && hasClass(n, "notes-main"));
  const cheat = findEl(frag, (n) => isEl(n) && getAttr(n, "id") === "cheat");
  const modpyq = findEl(frag, (n) => isEl(n) && n.tagName === "section" && getAttr(n, "id") === "modpyq");
  const pyqs = findEl(frag, (n) => isEl(n) && n.tagName === "section" && getAttr(n, "id") === "pyqs");

  const modules = [];
  if (notesMain) {
    for (const c of notesMain.childNodes) {
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
        modules.push({
          id: chip ? parseInt(text(chip).replace(/\D/g, ""), 10) : null,
          title: h3 ? text(h3).trim() : "",
          topics,
          html: serialize(c),
        });
      }
    }
  }

  const modpyqCards = [];
  if (modpyq) {
    for (const c of findEls(modpyq, (n) => isEl(n) && hasClass(n, "modpyq-card"))) {
      modpyqCards.push(serialize(c));
    }
  }

  return {
    pageHead: pageHead ? serialize(pageHead) : null,
    syllabus: syllabus ? serialize(syllabus) : null,
    modules,
    cheat: cheat ? serialize(cheat) : null,
    modpyqCards,
    pyqs: pyqs ? serialize(pyqs) : null,
  };
}

for (const key of ["fm", "som", "thermo"]) {
  const raw = readFileSync(`src/content/${key}.html`, "utf8");
  const s = splitSubject(raw);
  console.log(`\n===== ${key} =====`);
  console.log("pageHead:", s.pageHead ? `${s.pageHead.length} chars` : "MISSING");
  console.log("syllabus:", s.syllabus ? `${s.syllabus.length} chars` : "MISSING");
  console.log("cheat:", s.cheat ? `${s.cheat.length} chars` : "MISSING");
  console.log("pyqs:", s.pyqs ? `${s.pyqs.length} chars` : "MISSING");
  console.log("modpyqCards:", s.modpyqCards.length);
  console.log("modules:", s.modules.length);
  for (const m of s.modules) {
    console.log(`  M${m.id}: ${m.title} | ${m.html.length} chars | ${m.topics.length} topics: ${m.topics.map((t) => t.label).join("; ")}`);
  }
}