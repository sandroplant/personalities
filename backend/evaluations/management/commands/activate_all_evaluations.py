from django.apps import apps
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Promote all EvaluationMeta statuses to ACTIVE (dev utility)."

    def handle(self, *args, **options):
        try:
            EvaluationMeta = apps.get_model("evaluations", "EvaluationMeta")
        except LookupError:
            self.stdout.write("EvaluationMeta model not found; nothing to do.")
            return

        updated = EvaluationMeta.objects.exclude(status="ACTIVE").update(status="ACTIVE")
        self.stdout.write(self.style.SUCCESS(f"Promoted {updated} evaluations to ACTIVE."))
