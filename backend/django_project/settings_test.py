<<<<<<< Updated upstream
from copy import deepcopy
from . import settings as base  # import the module, not star-import

# Copy all UPPERCASE settings from base into this module's namespace
=======
# backend/django_project/settings_test.py

from copy import deepcopy
from . import settings as base  # import the module, not star-import

# Bring all UPPERCASE settings from base into this module namespace
>>>>>>> Stashed changes
for _name in dir(base):
    if _name.isupper():
        globals()[_name] = getattr(base, _name)

<<<<<<< Updated upstream
# ---- DRF auth for tests (flake8-friendly) ----
# Explicitly derive from base to satisfy static analysis (no F821).
_BASE_REST = getattr(base, "REST_FRAMEWORK", {})
REST_FRAMEWORK = deepcopy(_BASE_REST)

=======
# Ensure DRF uses SessionAuthentication in tests (prepend it to whatever is configured)
REST_FRAMEWORK = deepcopy(REST_FRAMEWORK)
>>>>>>> Stashed changes
_default_auth = tuple(REST_FRAMEWORK.get("DEFAULT_AUTHENTICATION_CLASSES", ()))
if "rest_framework.authentication.SessionAuthentication" not in _default_auth:
    REST_FRAMEWORK["DEFAULT_AUTHENTICATION_CLASSES"] = (
        "rest_framework.authentication.SessionAuthentication",
        *_default_auth,
    )

# Make password hashing fast in tests
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]
<<<<<<< Updated upstream

# ---- Local-only test DB override (does not affect CI) ----
import os as _os

if _os.environ.get("LOCAL_TESTS") == "1":
    # Use a file-based SQLite DB for local tests
    _here = _os.path.dirname(__file__)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": _os.path.join(_here, "test_db.sqlite3"),
        }
    }
    # Use in-memory email backend locally
    EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
=======
>>>>>>> Stashed changes
