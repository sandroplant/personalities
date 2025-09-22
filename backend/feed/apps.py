from django.apps import AppConfig


class FeedConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "feed"

    def ready(self) -> None:  # pragma: no cover - import signals for side effects
        try:
            from . import signals  # noqa: F401
        except Exception:
            # Avoid crashing if migrations haven't run yet.
            pass
