#!/usr/bin/env bash
set -e
cd /opt/data/mechvault
if [ -f .venv/bin/activate ]; then source .venv/bin/activate; fi
if [ -f .env ]; then set -a; source .env; set +a; fi
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
