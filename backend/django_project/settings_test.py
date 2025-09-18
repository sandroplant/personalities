from copy import deepcopy
import os as _os
from . import settings as base

# Copy UPPERCASE settings from base
for _name in dir(base):
    if _name.isupper():
        globals()[_name] = getattr(base, _name)

# DRF auth for tests (flake8-friendly)
_BASE_REST = getattr(base, "REST_FRAMEWORK", {})
REST_FRAMEWORK = deepcopy(_BASE_REST)
_default_auth = tuple(REST_FRAMEWORK.get("DEFAULT_AUTHENTICATION_CLASSES", ()))
if "rest_framework.authentication.SessionAuthentication" not in _default_auth:
    REST_FRAMEWORK["DEFAULT_AUTHENTICATION_CLASSES"] = (
        "rest_framework.authentication.SessionAuthentication",
        *_default_auth,
    )

# Fast hashing in tests
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# Local-only SQLite override (off in CI)
if _os.environ.get("LOCAL_TESTS") == "1":
    _here = _os.path.dirname(__file__)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": _os.path.join(_here, "test_db.sqlite3"),
        }
    }
    EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
