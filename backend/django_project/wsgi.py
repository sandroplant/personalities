import os
from pathlib import Path
from dotenv import load_dotenv
from django.core.wsgi import get_wsgi_application

# Determine the environment and set the appropriate .env file
BASE_DIR = Path(__file__).resolve().parent.parent
ENVIRONMENT = os.getenv('ENVIRONMENT', 'local')

if ENVIRONMENT == 'production':
    env_file = BASE_DIR / '.env'
else:
    env_file = BASE_DIR / '.env.local'  # Ensure this points to your .env.local

# Load environment variables from the .env file
load_dotenv(dotenv_path=env_file)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_project.settings')

application = get_wsgi_application()
