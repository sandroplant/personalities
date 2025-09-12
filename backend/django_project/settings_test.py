from .settings import *  # noqa
from .settings import BASE_DIR  # noqa: F401

# Force SQLite for tests
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "test.sqlite3",  # BASE_DIR comes from settings
    }
}
