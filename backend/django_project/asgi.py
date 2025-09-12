# django_project/asgi.py

import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
import core.routing  # Replace with your actual app routing

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "django_project.settings")
django.setup()

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": AuthMiddlewareStack(URLRouter(core.routing.websocket_urlpatterns)),
    }
)
