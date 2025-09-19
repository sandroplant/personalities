import importlib
import os
import sys
from pathlib import Path

import django
from django.apps import apps

PROJECT_ROOT = Path(__file__).resolve().parents[3]
BACKEND_DIR = PROJECT_ROOT / "backend"
for path in (str(PROJECT_ROOT), str(BACKEND_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

backend_userprofiles = importlib.import_module("backend.userprofiles")
sys.modules.setdefault("userprofiles", backend_userprofiles)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "django_project.settings")

if not apps.ready:
    django.setup()
