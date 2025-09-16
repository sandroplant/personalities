from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """SessionAuthentication that skips CSRF checks (test-only)."""

    def enforce_csrf(self, request):
        return None
