# django_project/asgi.py

import os

import core.routing  # Replace with your actual app routing
import django
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "django_project.settings")
django.setup()

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": AuthMiddlewareStack(URLRouter(core.routing.websocket_urlpatterns)),
    }
)
