from copy import deepcopy
from . import settings as base  # import the module, not star-import

# Bring all UPPERCASE settings from base into this module namespace
for _name in dir(base):
    if _name.isupper():
        globals()[_name] = getattr(base, _name)

# Ensure DRF uses SessionAuthentication in tests (prepend it to whatever is configured)
REST_FRAMEWORK = deepcopy(REST_FRAMEWORK)
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
