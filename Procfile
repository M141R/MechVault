# Astro standalone server. Builds to dist/server/entry.mjs via `npm run build`.
# PORT/HOST are supplied by the platform (Dokploy env var PORT, domain port must
# match). The ${VAR:-default} form degrades instead of crashing if a platform
# fails to inject one -- an unbound/failed start shows up as a Traefik 502 with
# no obvious cause in the build log.
web: HOST=0.0.0.0 PORT=${PORT:-4321} node dist/server/entry.mjs
