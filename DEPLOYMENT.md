Deployment Guide

Prerequisites
- Python 3.11, Docker, and docker-compose
- Postgres (if not using Docker)
- Environment variables configured (.env based on .env.example)

Quick Start (Docker)
1. Copy .env.example to .env and fill values
2. Build and start: docker-compose up --build
3. App runs at http://localhost:8000
4. Create superuser (shell inside container or locally) if needed

Local Run (without Docker)
1. python -m venv .venv && source .venv/bin/activate
2. pip install -r backend/requirements.txt
3. Create .env from .env.example (set SECRET_KEY, DATABASE_URL, etc.)
4. python backend/manage.py migrate
5. python backend/manage.py seed_data
6. python backend/manage.py seed_tags_questions
7. python backend/manage.py runserver

Production Checklist
- DEBUG=False, ALLOWED_HOSTS and CSRF_TRUSTED_ORIGINS set
- DATABASE_URL using Postgres
- Static files configured (Whitenoise or cloud storage)
- SECRET_KEY set
- Optional: CORS allowed origins set for frontend host
- Optional: Allauth configured (SITE_ID=1, backends, request context processor)
- Optional: Cloudinary/Spotify keys present if features enabled

Notes
- The docker backend uses scripts/entrypoint.sh to run migrations and collect static at boot.
- To seed data at boot, set SEED_DATA=1 in the backend service environment.
