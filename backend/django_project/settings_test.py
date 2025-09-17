"""Settings overrides for test runs."""

from .settings import *  # noqa: F401,F403
from . import settings as base_settings

REST_FRAMEWORK = {
    **base_settings.REST_FRAMEWORK,
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
}
