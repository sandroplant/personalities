from django.core.management.base import BaseCommand
from evaluations.models import Criterion

DEFAULT_CRITERIA = ['Honesty', 'Humor', 'Intelligence', 'Kindness', 'Reliability']

class Command(BaseCommand):
    help = 'Seeds the database with default evaluation criteria.'

    def handle(self, *args, **options):
        for name in DEFAULT_CRITERIA:
            obj, created = Criterion.objects.get_or_create(name=name)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created criterion: {name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Criterion already exists: {name}'))
        self.stdout.write(self.style.SUCCESS('Seeding complete.'))
