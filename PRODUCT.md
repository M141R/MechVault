# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user is the owner: a Mechanical Engineering undergraduate at BIT Mesra, batch 2029, currently in the 3rd semester (Aug-Dec 2026). He studies on a phone for most sessions and on a desktop for longer revision blocks. He is the person who decides what content enters the vault and in what shape.

Secondary users are a small number of approved classmates who sign up, land in a pending state, and are approved by the owner. They consume the same content and use the same tracker; they do not author content or reach the admin surface.

## Product Purpose

MechVault is a private study vault for one specific degree term: BIT Mesra Mechanical Engineering, 3rd semester. It holds six subjects (Fluid Mechanics, Strength of Materials, Thermodynamics, SOM, Manufacturing, Materials Science, plus Numerical Methods) as module-wise notes and previous-year question papers, and it tracks which questions the student has actually covered.

Success is exam-shaped, not traffic-shaped: the student can find a specific topic's notes, read the PYQ that appeared on it, and see what is still uncovered, on a phone, in the few minutes before a class. Coverage progress matters more than engagement metrics.

## Positioning

Module-wise study material plus a question-level coverage tracker, built around the actual BIT Mesra 3rd-sem exam pattern rather than a generic notes archive. The question tracker is keyed to real extracted PYQ questions per module with paper label, marks, and page reference, so coverage is measured against the papers that will actually be asked, not against an invented checklist.

Content is authored by the owner in raw HTML (`src/content/*.html`) and served through Astro SSR, so new material can be added as files rather than through a CMS.

## Operating Context

- Six subject content files under `src/content/`, each split into numbered modules (`t1`-`t4`) plus a PYQ section per subject.
- Numerical Methods is served through per-module pages (`/numerical/module/4`), not through the `/numerical` index, which intentionally carries no module blocks.
- Previous-year question papers are page-scanned PNGs under `images/papers/` (repo root, outside `public/` so the static handler cannot serve them; the only path to them is the auth-gated `/api/file`), named `SUBJECT_TYPE_YEAR_PART_pN.png`.
- The syllabus scope is authoritative in the department PDF, not in the textbook's full table of contents; the Fluid Mechanics midsem scope is Ch. 4/10/13.
- Study content is used in short, repeated bursts across a term rather than read once.
- All book, syllabus, and paper images sit behind the auth check and stream from Cloudflare R2 through `/api/file`.

## Capabilities and Constraints

- Astro SSR (`output: "server"`), standalone Node adapter, deployed to Dokploy on a Raspberry Pi at `mechvault.itsmihir.me`. Pushing to `main` triggers an auto-deploy. The Vercel adapter path still exists in `astro.config.mjs` behind a `VERCEL=1` env flag but is not the live deployment.
- Better Auth with username + password; new signups land `pending` and require owner approval at `/admin` before any content is reachable.
- Drizzle ORM on Neon Postgres holding real user accounts. Schema is pushed, not migrated, in practice.
- Single global stylesheet `public/assets/style.css` plus per-page scoped styles in `src/pages/**/*.astro` and two components. There is no Tailwind, no CSS-in-JS, no component library.
- Page content is raw HTML strings injected via `set:html`, so content and template concerns are split across `.html` files and `.astro` files.
- The tracker question extractor reads the subject HTML files and must find structurally valid, closed section markup; malformed nesting silently yields zero questions for that subject.
- Breakpoints are 860px and 560px. A `prefers-reduced-motion` block and print styles already exist.
- Single-account session enforcement exists via `/api/single-login`.

## Evidence on Hand

- Real extracted PYQ questions per module with module name, paper label, marks, and page reference; currently 357 questions across the tracker after the FM repair.
- Real scanned papers in `public/images/papers/` and textbook page images in `public/images/`.
- The authoritative BIT Mesra NEP ME syllabus PDF.
- No testimonials, no user counts, no benchmarks, no pricing, no awards. Future work must not invent any of these.

## Product Principles

1. **Coverage over consumption.** The tracker's job is to tell the student what is not yet covered against real papers. A number that reads well but is not grounded in extracted questions is worse than no number.
2. **Content is the product.** Notes and papers are the reason the vault exists. Chrome must never out-compete the study material for attention.
3. **Honest absence over invented filler.** When a subject has no PYQ section, show that it has none. Do not synthesize questions, fake counts, or placeholder testimonials to make a page look complete.
4. **Phone-first for bursts, desktop-equal for depth.** Short study sessions happen on a phone; layout must not break at 375px even though most authoring happens at 1280px.
5. **Never fabricate precision.** No fake-precise statistics, no invented progress percentages, no placeholder metrics styled to look real.

## Accessibility & Inclusion

The owner studies in short sessions, often in poor lighting on a phone, which makes legibility and contrast a practical requirement rather than a compliance checkbox. Keyboard and touch targets must stay usable because much of the study interaction happens one-handed.