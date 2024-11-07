import json
from django.core.management.base import BaseCommand
from core.models import YourDjangoModel  # Replace with your actual model
from pathlib import Path

class Command(BaseCommand):
    help = 'Imports data from MongoDB JSON export into PostgreSQL'

    def handle(self, *args, **options):
        # Specify your JSON file path
        json_path = Path("your_collection_name.json")
        
        # Load JSON data
        with open(json_path, "r") as file:
            data = json.load(file)
        
        # Iterate over each record and save to PostgreSQL
        for record in data:
            # Create a new instance of your model
            # Replace 'field1', 'field2' with your actual field names
            model_instance = YourDjangoModel(
                field1=record.get("field1"),
                field2=record.get("field2"),
                # Add as many fields as necessary
            )
            model_instance.save()

        self.stdout.write(self.style.SUCCESS('Data import completed successfully!'))
