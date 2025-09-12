class DevCorsMiddleware:
    """Very small CORS middleware for local development.

    Reads allowed origins from environment variable DJANGO_CORS_DEV_ORIGINS (comma-separated)
    or defaults to http://localhost:3000 and http://127.0.0.1:3000.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        import os

        raw = os.environ.get("DJANGO_CORS_DEV_ORIGINS")
        if raw:
            self.allowed = {o.strip() for o in raw.split(",") if o.strip()}
        else:
            self.allowed = {"http://localhost:3000", "http://127.0.0.1:3000"}

    def __call__(self, request):
        origin = request.META.get("HTTP_ORIGIN")
        # Preflight
        if request.method == "OPTIONS" and origin and origin in self.allowed:
            from django.http import HttpResponse

            resp = HttpResponse()
            self._set_headers(resp, origin)
            return resp

        response = self.get_response(request)
        if origin and origin in self.allowed:
            self._set_headers(response, origin)
        return response

    def _set_headers(self, response, origin: str):
        response["Access-Control-Allow-Origin"] = origin
        response["Access-Control-Allow-Credentials"] = "true"
        response["Access-Control-Allow-Methods"] = (
            "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        )
        response["Access-Control-Allow-Headers"] = (
            "Content-Type, X-CSRFToken, Authorization"
        )
