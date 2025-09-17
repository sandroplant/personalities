from copy import deepcopy
from . import settings as base  # import the module, not star-import

# Copy all UPPERCASE settings from base into this module's namespace
for _name in dir(base):
    if _name.isupper():
        globals()[_name] = getattr(base, _name)

# ---- DRF auth for tests (flake8-friendly) ----
# Explicitly derive from base to satisfy static analysis (no F821).
_BASE_REST = getattr(base, "REST_FRAMEWORK", {})
REST_FRAMEWORK = deepcopy(_BASE_REST)

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
