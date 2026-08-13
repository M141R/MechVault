# MechVault — Deploy on the Pi 5 (Dokploy)

MechVault is a FastAPI + SQLite app. SQLite is intentionally file-based so a single
process on the Pi owns the DB (no separate Postgres needed at this scale).

## Local / dev run
```bash
cd /opt/data/mechvault
uv venv .venv && uv pip install --python .venv/bin/python -r requirements.txt
# edit .env: set OPENCODE_ZEN_API_KEY for AI, change MECHVAULT_SECRET
python seed.py
./run.sh            # uvicorn on :8000
```

## Dokploy (Docker)
1. Create a Dockerfile in this folder:
```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends build-essential curl \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python seed.py
EXPOSE 8000
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8000"]
```
2. In Dokploy: New Project → Dockerfile, point at the MechVault repo / folder.
3. Set env in Dokploy: `MECHVAULT_SECRET`, `OPENCODE_ZEN_API_KEY`, `MECHVAULT_AI_MODEL`.
4. Map host port (e.g. 3001) → container 8000. Your Dokploy already runs on :3000;
   put MechVault on :3001 to avoid the clash, or behind its Traefik host.
5. Persistent volume: mount `/app/data` so `mechvault.db` and uploads survive rebuilds.

## Notes
- Owner account is created by `seed.py` (email/pw from `.env`).
- First registered user also becomes owner if no user exists yet.
- Watermark is per-user email; owner downloads are un-watermarked.
- AI generation is off until `OPENCODE_ZEN_API_KEY` is set.
