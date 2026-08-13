# MechVault — Deploy (Dokploy, Nixpacks)

FastAPI + SQLite notes/PYQ platform. SQLite is file-based so a single process owns the
DB (no separate Postgres at this scale).

## Local / dev run
```bash
cd /opt/data/mechvault
uv venv .venv && uv pip install --python .venv/bin/python -r requirements.txt
# edit .env: set OPENCODE_ZEN_API_KEY for AI, change MECHVAULT_SECRET
python seed.py
./run.sh            # uvicorn on :8000
```

## Dokploy (Nixpacks)
1. New Project → **Nixpacks** build pack, point at the `MechVault` repo, branch `fastapi`.
   (No Dockerfile — it was removed; Nixpacks reads `Procfile` instead.)
2. `Procfile` start command:
   ```
   web: python seed.py; uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
   - Nixpacks runs the `web` process and proxies `$PORT` (Dokploy default 3000).
   - `seed.py` is idempotent: it creates tables + the owner account if absent, so the
     first boot self-heals even on a fresh container.
3. Env vars in Dokploy:
   - `MECHVAULT_SECRET` (session signing) — set a strong random value
   - `OPENCODE_ZEN_API_KEY` (optional, enables AI notes)
   - `MECHVAULT_AI_MODEL` (optional, e.g. `nemotron-3-ultra-free`)
   - `MECHVAULT_OWNER_EMAIL` / `MECHVAULT_OWNER_PW` (optional, override seed defaults)
4. **Persistent volume (important):** mount a volume to `/app/data` so `mechvault.db` +
   `uploads/` survive rebuilds. Without it, every redeploy reseeds a fresh DB (you lose
   registered users / uploaded papers).
5. Map host port → container `$PORT`, or expose via the Dokploy Traefik host.

## Troubleshooting
- **"Welcome to nginx!" page:** the app container isn't serving. Root cause was a missing
  start command (no `Procfile` under the old Docker setup) → Traefik had no healthy backend
  and showed its default nginx page. Fixed by the `Procfile` above. If it recurs, check the
  build/start logs in Dokploy — Nixpacks must finish `pip install` and the `web` process must
  stay up.
- App binds `0.0.0.0:$PORT`. Never bind `127.0.0.1` or a hard-coded port (breaks Nixpacks proxy).
