from django.apps import AppConfig


class EconomyConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "economy"

    def ready(self):  # pragma: no cover - import signals if added later
        try:
            import economy.signals  # noqa: F401
        except Exception:
            pass
