from core.models import User as CoreUser
from rest_framework.authentication import BaseAuthentication, SessionAuthentication


class SessionUserIdAuthentication(BaseAuthentication):
    """Authenticate a user from request.session['user_id'].

    Allows tests (and simple session flows) that stash a user id in the
    Django session to be treated as authenticated in DRF views.
    """

    def authenticate(self, request):
        user_id = request.session.get("user_id")
        if not user_id:
            return None
        try:
            uid = int(user_id)
        except (TypeError, ValueError):
            return None

        try:
            user = CoreUser.objects.get(id=uid)
        except CoreUser.DoesNotExist:
            return None

        return (user, None)


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """SessionAuthentication that skips CSRF checks (test-only)."""

    def enforce_csrf(self, request):
        return None
