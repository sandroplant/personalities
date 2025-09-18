from django.apps import AppConfig


class EvaluationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "evaluations"

    def ready(self) -> None:
        # Ensure additive models are registered for migrations & ORM
        try:
            from . import rater_models  # noqa: F401
        except Exception:
            pass
        try:
            from . import meta_models  # noqa: F401
        except Exception:
            pass
