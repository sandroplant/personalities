#!/usr/bin/env bash
set -euo pipefail

cd /app/backend

# If DATABASE_URL is not set, but Postgres env vars are, construct it.
if [ -z "${DATABASE_URL:-}" ] && [ -n "${POSTGRES_HOST:-}" ]; then
  export DATABASE_URL="postgres://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}/${POSTGRES_DB:-personalities}"
fi

python manage.py migrate --noinput

# Collect static
python manage.py collectstatic --noinput || true

# Seed data if requested
if [ "${SEED_DATA:-0}" = "1" ]; then
  python manage.py seed_data || true
  python manage.py seed_tags_questions || true
fi

# Run server (Gunicorn in production-style)
exec gunicorn django_project.wsgi:application --bind 0.0.0.0:8000 --workers ${WEB_CONCURRENCY:-3}

