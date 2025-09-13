from .settings import *  # noqa
from .settings import BASE_DIR  # noqa: F401

# Force SQLite for tests
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "test.sqlite3",
    }
}

# Use SessionAuthentication in tests so django.test.Client / force_login() works
REST_FRAMEWORK = dict(globals().get("REST_FRAMEWORK", {}))  # copy base config
REST_FRAMEWORK["DEFAULT_AUTHENTICATION_CLASSES"] = (
    "rest_framework.authentication.SessionAuthentication",
    "rest_framework_simplejwt.authentication.JWTAuthentication",
)
