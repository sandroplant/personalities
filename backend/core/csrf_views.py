from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie


@ensure_csrf_cookie
def csrf(request):
    """Set CSRF cookie for SPA clients and return a tiny JSON payload."""
    return JsonResponse({"detail": "ok"})
