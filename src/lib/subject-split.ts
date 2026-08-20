import { parseFragment, serialize, serializeOuter } from "parse5";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface PNode {
  nodeName?: string;
  tagName?: string;
  attrs?: { name: string; value: string }[];
  childNodes?: PNode[];
  value?: string;
}

export interface TopicLink {
  id: string;
  label: string;
}

export interface SubjectModule {
  id: number;
  title: string;
  topics: TopicLink[];
  html: string;
}

export interface SubjectContent {
  pageHead: string;
  modules: SubjectModule[];
  cheat: string;
  modpyqCards: string[];
  pyqs: string;
  /** "Pattern insight" callout extracted from the old syllabus section (may be null). */
  insight: string | null;
  /** FM-only: the professor's pruned Bansal list block (may be null). */
  bansal: string | null;
}

function isEl(n: PNode | undefined | null): n is PNode {
  return !!n && !!n.tagName;
}

function getAttr(n: PNode, name: string): string | null {
  if (!n.attrs) return null;
  for (const a of n.attrs) if (a.name === name) return a.value;
  return null;
}

function hasClass(n: PNode, cls: string): boolean {
  const c = getAttr(n, "class");
  return !!c && c.split(/\s+/).includes(cls);
}

function text(n: PNode | undefined | null): string {
  if (!n) return "";
  if (n.nodeName === "#text") return n.value || "";
  if (n.childNodes) return n.childNodes.map(text).join("");
  return "";
}

function findEl(node: PNode | undefined | null, pred: (n: PNode) => boolean): PNode | null {
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

function findEls(node: PNode | undefined | null, pred: (n: PNode) => boolean, out: PNode[] = []): PNode[] {
  if (!node) return out;
  if (pred(node)) out.push(node);
  if (node.childNodes) for (const c of node.childNodes) findEls(c, pred, out);
  return out;
}

function findById(node: PNode | undefined | null, id: string): PNode | null {
  return findEl(node, (n) => isEl(n) && getAttr(n, "id") === id);
}

/** Serialize a list of sibling nodes as one fragment. */
function serializeList(nodes: PNode[]): string {
  const frag: PNode = { nodeName: "#document-fragment", childNodes: nodes };
  return serialize(frag as any);
}

export function splitSubject(raw: string): SubjectContent {
  const frag = parseFragment(raw) as PNode;
  const pageHead = findEl(frag, (n) => isEl(n) && n.tagName === "section" && hasClass(n, "page-head"));
  const syllabus = findEl(frag, (n) => isEl(n) && n.tagName === "section" && getAttr(n, "id") === "syllabus");
  const notesMain = findEl(frag, (n) => isEl(n) && hasClass(n, "notes-main"));
  const modpyq = findEl(frag, (n) => isEl(n) && n.tagName === "section" && getAttr(n, "id") === "modpyq");
  const pyqs = findEl(frag, (n) => isEl(n) && n.tagName === "section" && getAttr(n, "id") === "pyqs");

  const modules: SubjectModule[] = [];
  if (notesMain) {
    for (const c of notesMain.childNodes ?? []) {
      if (!isEl(c)) continue;
      if (hasClass(c, "module-block")) {
        const head = findEl(c, (n) => isEl(n) && hasClass(n, "module-head"));
        const chip = head ? findEl(head, (n) => isEl(n) && hasClass(n, "mchip")) : null;
        const h3 = head ? findEl(head, (n) => isEl(n) && n.tagName === "h3") : null;
        const toc = findEl(c, (n) => isEl(n) && n.tagName === "nav" && hasClass(n, "toc"));
        const topics: TopicLink[] = [];
        if (toc) {
          for (const a of findEls(toc, (n) => isEl(n) && n.tagName === "a")) {
            const href = getAttr(a, "href") || "";
            topics.push({ id: href.replace(/^#/, ""), label: text(a).trim() });
          }
        }
        const id = chip ? parseInt(text(chip).replace(/\D/g, ""), 10) : null;
        if (id === null) continue;

        // Drop the module-head so module pages can render their own header.
        const clone = { ...c, childNodes: (c.childNodes ?? []).filter((k) => !(isEl(k) && hasClass(k, "module-head"))) };

        modules.push({
          id,
          title: h3 ? text(h3).trim() : `Module ${id}`,
          topics,
          html: serializeOuter(clone as any),
        });
      }
    }
  }

  const modpyqCards: string[] = [];
  if (modpyq) {
    for (const c of findEls(modpyq, (n) => isEl(n) && hasClass(n, "modpyq-card"))) {
      modpyqCards.push(serializeOuter(c as any));
    }
  }

  let insight: string | null = null;
  let bansal: string | null = null;
  if (syllabus) {
    const container = findEl(syllabus, (n) => isEl(n) && hasClass(n, "container"));
    const callout = findEl(syllabus, (n) => isEl(n) && hasClass(n, "callout") && /pattern insight/i.test(text(n)));
    if (callout) insight = serializeOuter(callout as any);

    if (container) {
      const kids = container.childNodes ?? [];
      let idx = -1;
      for (let i = 0; i < kids.length; i++) {
        const k = kids[i];
        if (isEl(k) && hasClass(k, "section-head") && /Bansal/i.test(text(k))) {
          idx = i;
          break;
        }
      }
      if (idx >= 0) {
        bansal = serializeList(kids.slice(idx));
      }
    }
  }

  return {
    pageHead: pageHead ? serializeOuter(pageHead as any) : "",
    modules,
    cheat: findById(frag, "cheat") ? serializeOuter(findById(frag, "cheat") as any) : "",
    modpyqCards,
    pyqs: pyqs ? serializeOuter(pyqs as any) : "",
    insight,
    bansal,
  };
}