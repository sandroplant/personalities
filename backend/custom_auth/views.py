from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.db import IntegrityError

import jwt
from posts.models import Post
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from userprofiles.models import Profile  # Updated import


class AuthView(APIView):
    """Unified authentication view handling registration and login."""

    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        action = (
            self.kwargs.get("action")
            or kwargs.get("action")
            or request.data.get("action", "")
        ).lower()
        if action not in {"register", "login"}:
            raise ValidationError(
                {"action": "Action must be either 'register' or 'login'."}
            )

        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            raise ValidationError({"detail": "Username and password are required."})

        if action == "register":
            return self._register_user(username, password)

        return self._login_user(request, username, password)

    def _register_user(self, username: str, password: str) -> Response:
        user_model = get_user_model()
        try:
            user = user_model.objects.create_user(username=username, password=password)
        except IntegrityError:
            return Response(
                {"error": "Username already exists"},
                status=status.HTTP_409_CONFLICT,
            )

        Profile.objects.get_or_create(user=user)

        return Response(
            {"message": "User registered successfully", "id": user.id},
            status=status.HTTP_201_CREATED,
        )

    def _login_user(self, request, username: str, password: str) -> Response:
        user = authenticate(request=request, username=username, password=password)
        if not user:
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        jwt_secret = getattr(settings, "JWT_SECRET", None) or settings.SECRET_KEY

        token = jwt.encode({"userId": str(user.id)}, jwt_secret, algorithm="HS256")
        return Response(
            {"message": "User logged in", "token": token},
            status=status.HTTP_200_OK,
        )


@api_view(["POST"])
def create_post(request):
    title = request.data.get("title")
    content = request.data.get("content")
    author_id = request.data.get("author")  # Expecting author ID

    if not title or not content or not author_id:
        return Response(
            {"error": "Title, content, and author are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user_model = get_user_model()
    try:
        author = user_model.objects.get(id=author_id)
    except user_model.DoesNotExist:
        return Response({"error": "Author not found"}, status=status.HTTP_404_NOT_FOUND)

    try:
        post = Post(title=title, content=content, author=author)
        post.save()
        return Response({"message": "Post created"}, status=status.HTTP_201_CREATED)
    except Exception as exc:  # pragma: no cover - unexpected errors bubble up
        return Response(
            {"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
