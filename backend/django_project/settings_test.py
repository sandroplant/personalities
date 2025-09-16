from .settings import *  # noqa
from .settings import BASE_DIR  # noqa: F401

# Use SQLite for tests (separate file in repo dir)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "test.sqlite3",
    }
}

# DRF defaults for tests: CSRF‑exempt session + JWT; open permissions
REST_FRAMEWORK = dict(globals().get("REST_FRAMEWORK", {}))
REST_FRAMEWORK["DEFAULT_AUTHENTICATION_CLASSES"] = (
    "core.auth.CsrfExemptSessionAuthentication",
    "rest_framework_simplejwt.authentication.JWTAuthentication",
)
REST_FRAMEWORK["DEFAULT_PERMISSION_CLASSES"] = ("rest_framework.permissions.AllowAny",)
