"""
Local development settings that build on top of the project's real settings
but swap the database to SQLite and keep CSRF/CORS configured for the SPA.

Usage (terminal):
  cd backend
  export DJANGO_SETTINGS_MODULE=django_project.settings_local
  python manage.py migrate
  python manage.py runserver 127.0.0.1:8000
"""

from pathlib import Path

# Import the project's real settings first
from .settings import *  # noqa: F401,F403

# Ensure BASE_DIR is available
BASE_DIR = globals().get("BASE_DIR", Path(__file__).resolve().parent.parent)

# Use SQLite for local development so we don't depend on Docker 'db' host
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": str(Path(BASE_DIR) / "db.sqlite3"),
    }
}

# Make sure custom user model is active
AUTH_USER_MODEL = globals().get("AUTH_USER_MODEL", "core.User")

# Keep debug on for local dev
DEBUG = True

# CSRF/CORS for SPA dev
ALLOWED_HOSTS = list(set(list(globals().get("ALLOWED_HOSTS", [])) + ["127.0.0.1", "localhost"]))

CSRF_TRUSTED_ORIGINS = list(
    set(list(globals().get("CSRF_TRUSTED_ORIGINS", [])) + ["http://localhost:3000", "http://127.0.0.1:3000"])
)

CORS_ALLOWED_ORIGINS = list(
    set(list(globals().get("CORS_ALLOWED_ORIGINS", [])) + ["http://localhost:3000", "http://127.0.0.1:3000"])
)

CORS_ALLOW_CREDENTIALS = True
