import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import node from "@astrojs/node";

// Vercel injects VERCEL=1 at build time. Everything else (local, Nixpacks,
// Dokploy, Heroku) builds the standalone Node server -> dist/server/entry.mjs.
const adapter = process.env.VERCEL === "1" ? vercel() : node({ mode: "standalone" });

export default defineConfig({
  output: "server",
  adapter,
  site: process.env.SITE_URL || "http://localhost:4321",
  trailingSlash: "never",
  redirects: {
    "/study-guide": "/"
  }
});
