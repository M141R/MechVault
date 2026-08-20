import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

export default defineConfig({
  output: "server",
  adapter: vercel(),
  site: process.env.SITE_URL || "http://localhost:4321",
  trailingSlash: "never",
  redirects: {
    "/study-guide": "/"
  }
});
