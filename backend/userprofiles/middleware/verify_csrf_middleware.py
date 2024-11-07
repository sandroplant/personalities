# userprofiles/middleware/verify_csrf_middleware.py

from django.http import JsonResponse
from django.conf import settings
from django.middleware.csrf import CsrfViewMiddleware, csrf

class VerifyCSRFMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check if it's a safe method (GET, HEAD, OPTIONS)
        if request.method not in ['GET', 'HEAD', 'OPTIONS']:
            csrf_token_from_request = (
                request.headers.get('X-XSRF-TOKEN') or
                request.headers.get('X-CSRF-TOKEN') or
                request.POST.get('_csrf') or
                request.GET.get('_csrf')
            )

            if not csrf_token_from_request:
                return JsonResponse({'error': 'CSRF token missing'}, status=403)

            secret = request.session.get('csrfSecret')
            if not secret:
                return JsonResponse({'error': 'CSRF secret not found'}, status=403)

            # Verify the CSRF token
            if not csrf.verify(secret, csrf_token_from_request):
                return JsonResponse({'error': 'Invalid CSRF token'}, status=403)

        response = self.get_response(request)
        return response
