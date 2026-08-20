import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const PAGES = {
  index: { title: "MechVault — 3rd Semester Study Hub | BIT Mesra", active: "home" },
  fm: { title: "Fluid Mechanics — Notes & PYQs | MechVault", active: "fm" },
  som: { title: "Strength of Materials — Notes & PYQs | MechVault", active: "som" },
  thermo: { title: "Thermodynamics — Notes & PYQs | MechVault", active: "thermo" },
};

for (const [name, meta] of Object.entries(PAGES)) {
  const html = readFileSync(`${name}.html`, "utf8");

  // Extract body content between <body> and </body>
  const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
  if (!bodyMatch) throw new Error(`no body in ${name}.html`);
  let body = bodyMatch[1];

  // Remove nav, footer, and standalone scripts
  body = body.replace(/<nav class="nav">[\s\S]*?<\/nav>/, "");
  body = body.replace(/<footer class="footer">[\s\S]*?<\/footer>/, "");
  body = body.replace(/<script src="assets\/app\.js"><\/script>/g, "");
  body = body.replace(/<script src="assets\/style\.css"><\/script>/g, "");

  // Rewrite internal links: *.html -> /
  body = body.replace(/(href|action)="(index|fm|som|thermo|study-guide)\.html"/g, (m, attr, page) => {
    const target = page === "index" ? "/" : `/${page}`;
    return `${attr}="${target}"`;
  });

  // Rewrite asset references (images, books, syllabus) to the auth-proxied endpoint
  body = body.replace(
    /((?:src|href|data-zoom)=")(images|books|syllabus)\//g,
    (m, prefix, dir) => `${prefix}/api/file?path=${dir}/`
  );

  writeFileSync(`src/content/${name}.html`, body);
  console.log(`content/${name}.html written`);
}

// Astro pages
for (const [name, meta] of Object.entries(PAGES)) {
  const page = `---
import BaseLayout from "../layouts/BaseLayout.astro";
import content from "../content/${name}.html?raw";
---
<BaseLayout title=${JSON.stringify(meta.title)} active=${JSON.stringify(meta.active)}>
  <Fragment set:html={content} />
</BaseLayout>
`;
  const target = name === "index" ? "src/pages/index.astro" : `src/pages/${name}.astro`;
  writeFileSync(target, page);
  console.log(`${target} written`);
}