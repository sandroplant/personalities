#!/usr/bin/env python
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

if __name__ == '__main__':
    BASE_DIR = Path(__file__).resolve().parent
    ENVIRONMENT = os.getenv('ENVIRONMENT', 'local')

    if ENVIRONMENT == 'production':
        env_file = BASE_DIR / '.env'
    else:
        env_file = BASE_DIR / '.env.local'

    # Load environment variables
    load_dotenv(dotenv_path=env_file)

    # Debug statements
    print(f"DEBUG: ENVIRONMENT = {ENVIRONMENT}")
    print(f"DEBUG: env_file = {env_file}")
    print(f"DEBUG: POSTGRES_HOST = {os.getenv('POSTGRES_HOST')}")

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_project.settings')

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django..."
        ) from exc
    execute_from_command_line(sys.argv)
