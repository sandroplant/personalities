"""Session-aware profile endpoints that operate on Django auth sessions."""

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Profile
from .serializers import ProfileSerializer

User = get_user_model()


def _get_session_user(request):
    """Return the authenticated user associated with the current session."""
    user = getattr(request, "user", None)
    if user and getattr(user, "is_authenticated", False):
        return user

    user_id = request.session.get("_auth_user_id")
    if not user_id:
        return None

    try:
        return User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return None


def _ensure_session_profile(user):
    """Fetch or create the profile for the given user."""
    profile, _ = Profile.objects.get_or_create(user=user)
    return profile


@api_view(["GET"])
@permission_classes([AllowAny])
def get_user_profile_api(request):
    """Return the profile for the user stored in the current session."""
    user = _get_session_user(request)
    if not user:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    profile = _ensure_session_profile(user)
    serializer = ProfileSerializer(profile)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST", "PUT", "PATCH"])
@permission_classes([AllowAny])
def update_user_profile_api(request):
    """Update the session user's profile with the provided payload."""
    user = _get_session_user(request)
    if not user:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    profile = _ensure_session_profile(user)
    serializer = ProfileSerializer(profile, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_200_OK)
