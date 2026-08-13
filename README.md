# MechVault

A semester **notes, tutorials & PYQ (previous-year-question) platform** for engineering students — built to turn scattered PDFs and class notes into a clean, searchable, multi-semester knowledge base.

## Features
- 📚 **Semester → Subject → Topic** hierarchy with rich notes (Markdown)
- 📄 **PDF notes & paper viewer** with per-user **email watermarking** (owner exempt)
- 🤖 **AI note generation** from uploaded resources (opencode-zen / Nemotron), gracefully degrades when no key is set
- 🔐 **Multi-user auth** (argon2 password hashing) with an owner/admin role
- 🛠 **Admin panel** to manage semesters, subjects, topics, and trigger AI generation
- 🎨 Dark UI built on the SoleDrop design system (`#0A0A0F` / `#12121A` / `#E94560`, Inter + JetBrains Mono)

## Stack
FastAPI · SQLAlchemy · SQLite · Jinja2 + HTMX · PyMuPDF · python-pptx · argon2-cffi

## Local dev
```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env          # set MECHVAULT_SECRET + OPENCODE_ZEN_API_KEY
.venv/bin/python seed.py     # creates owner + sample Sem-3 Fluid Mechanics notes
.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Open http://localhost:8000 and log in with the owner credentials from `.env`.

## Deploy
Containerized (`Dockerfile`). Point your CI/CD (e.g. Dokploy) at `main`; the build installs deps and serves on `:8000`. Inject secrets via the deploy platform's environment variables (do **not** commit `.env`).
