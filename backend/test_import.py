import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_project.settings')
django.setup()

from drf_spectacular.renderers import SpectacularJSONRenderer

print("SpectacularJSONRenderer imported successfully.")

