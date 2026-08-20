# MechVault — Astro SSR + real auth

BIT Mesra ME 3rd-sem study hub, rebuilt from static HTML into an **Astro** app with
real server-side authentication and admin-approved account creation.

## Stack

- **Astro** (SSR) + `@astrojs/vercel` (serverless) → deployed on **Vercel**
- **Better Auth** — username + password login, admin plugin
- **Drizzle ORM** + **Neon Postgres** — users, sessions, accounts
- **Cloudflare R2** — books / syllabus / paper-scan images behind the auth check

## Local setup

1. Install deps

   ```bash
   npm install
   ```

2. Provision a **Neon** Postgres database (free tier) and copy its connection string.

3. Create the tables and push the schema:

   ```bash
   cp .env.example .env          # then fill in DATABASE_URL, R2 keys
   npm run db:push
   ```

4. Seed the admin account (approves other users):

   ```bash
   # set ADMIN_USERNAME / ADMIN_PASSWORD in .env first
   npm run seed:admin
   # prints the admin user id — add it to ADMIN_USER_IDS (comma-separated)
   ```

5. Upload the book/syllabus/image files to R2 (optional for dev — dev falls back to
   local files; required for production):

   ```bash
   npm run upload:r2        # or: npm run upload:r2 -- --missing
   ```

6. Run it:

   ```bash
   npm run dev
   ```

## Vercel deployment

1. Push the repo to GitHub and import it in Vercel.
2. Build command: `npm run build` (default). The output adapter is `@astrojs/vercel`.
3. Set environment variables:

   | Variable | Value |
   |---|---|
   | `BETTER_AUTH_SECRET` | random 32+ char string |
   | `BETTER_AUTH_URL` | your `https://*.vercel.app` (or custom domain) URL |
   | `DATABASE_URL` | Neon Postgres connection string |
   | `ADMIN_USER_IDS` | comma-separated user ids (from `npm run seed:admin`) |
   | `R2_ACCOUNT_ID` | Cloudflare account id |
   | `R2_ACCESS_KEY_ID` | R2 API token access key |
   | `R2_SECRET_ACCESS_KEY` | R2 API token secret |
   | `R2_BUCKET` | R2 bucket name |

4. Deploy. Optionally add `SITE_URL` to match the production URL.

## How the approval flow works

1. Anyone can `POST /api/auth/sign-up/email` with `username`, `name`, `password`
   (email is auto-filled with `<username>@mechvault.local`).
2. New users get `status = 'pending'` (DB default). They land on `/pending`.
3. The admin signs in, opens `/admin`, and clicks **Approve** for each account.
   That flips `status` to `approved`.
4. Astro middleware (`src/middleware.ts`) guards every page/API route:
   - unauthenticated → `/login`
   - not approved → `/pending`
   - `/admin/*` → admins only
   - `/api/file` streams R2 files (books/syllabus/images) only to approved users.

## Content notes

- Page content lives in `src/content/*.html` (extracted from the old static pages).
  Rebuild them any time the `.html` sources change:

  ```bash
  node scripts/port-content.mjs
  ```

- `public/assets/app.js` is the original UI script with the old client-side password
  guard removed (real auth replaced it).
- `search-index.json` now points at `/`, `/fm`, `/som`, `/thermo`.