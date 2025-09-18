# userprofiles/middleware/csrf_middleware.py

from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

import csrf  # Import the CSRF utility you're using (this can be your own or a package)


class CSRFMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # Generate and set CSRF token
        csrf_secret = csrf.secretSync()
        request.csrf_secret = csrf_secret
        csrf_token = csrf.create(csrf_secret)
        request.COOKIES["XSRF-TOKEN"] = csrf_token

    def process_view(self, request, view_func, view_args, view_kwargs):
        # Verify CSRF token
        csrf_token = request.COOKIES.get("XSRF-TOKEN")
        if not csrf.verify(request.csrf_secret, csrf_token):
            return JsonResponse({"error": "Invalid CSRF token"}, status=403)

        return None
