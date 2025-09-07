from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django_ratelimit.decorators import ratelimit
import logging

logger = logging.getLogger(__name__)


class RateLimitMiddleware(MiddlewareMixin):
    def process_view(self, request, view_func, view_args, view_kwargs):
        # Apply rate limit (e.g., 100 requests per 15 minutes) per IP
        if self.is_rate_limited(request):
            ip = self.get_client_ip(request)
            logger.warning(f"Rate limit exceeded for IP: {ip}")
            return JsonResponse(
                {"error": "Too many requests, please try again later."},
                status=429,
            )
        return None  # Continue processing if rate limit not reached

    @ratelimit(key="ip", rate="100/15m", method="GET", block=True)
    def is_rate_limited(self, request):
        return getattr(request, "limited", False)

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip
