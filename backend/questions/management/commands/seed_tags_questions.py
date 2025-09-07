from django.core.management.base import BaseCommand
from questions.models import Tag, Question
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Seeds default tags and sample questions"

    def handle(self, *args, **options):
        default_tags = [
            "Politics",
            "Religion",
            "Philosophy",
            "Appearance",
            "Relationships",
            "Communication",
        ]
        for tag_name in default_tags:
            tag_obj, created = Tag.objects.get_or_create(name=tag_name)
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f"Created tag: {tag_name}")
                )
        # Create sample questions if there are no questions yet
        if not Question.objects.exists():
            User = get_user_model()
            author = User.objects.order_by("id").first()
            if author:
                # Example yes/no question
                tag_philosophy = Tag.objects.get(name="Philosophy")
                Question.objects.create(
                    author=author,
                    text="Do you like pineapple on pizza?",
                    tag=tag_philosophy,
                    options=["Yes", "No"],
                    is_anonymous=False,
                )
                # Example multi-choice question
                tag_relationships = Tag.objects.get(name="Relationships")
                Question.objects.create(
                    author=author,
                    text="What is your favorite season?",
                    tag=tag_relationships,
                    options=["Spring", "Summer", "Autumn", "Winter"],
                    is_anonymous=False,
                )
                self.stdout.write(
                    self.style.SUCCESS("Created sample questions")
                )
        self.stdout.write(self.style.SUCCESS("Seeding complete."))
