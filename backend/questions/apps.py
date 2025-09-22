from django.apps import AppConfig


class QuestionsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "questions"

    def ready(self) -> None:  # pragma: no cover - side effect import
        from . import signals  # noqa: F401
