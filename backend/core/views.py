import base64
import json
import secrets
import string

import bleach
import requests
from django.conf import settings
from django.contrib.auth import get_user_model, login, logout
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.csrf import csrf_exempt
from django_ratelimit.decorators import ratelimit
from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Message, Post, Profile
from .serializers import (
    LoginSerializer,
    MessageSerializer,
    PostSerializer,
    ProfileSerializer,
    RegisterSerializer,
    UserSerializer,
)
from .utils.logger import logger
from .utils.openai_service import get_openai_response
from .utils.spotify_auth_utils import generate_code_challenge, generate_code_verifier

User = get_user_model()


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_user_profile_api(request):
    user = request.user
    profile = user.profile
    serializer = ProfileSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_profile_api(request):
    user = request.user
    serializer = ProfileSerializer(user.profile)
    return Response(serializer.data)


class GetUserProfileApi(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        serializer = ProfileSerializer(request.user.profile)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UpdateUserProfileApi(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        return self._update_profile(request, partial=True)

    def put(self, request, *args, **kwargs):
        return self._update_profile(request, partial=False)

    def patch(self, request, *args, **kwargs):
        return self._update_profile(request, partial=True)

    def _update_profile(self, request, partial):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(profile, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


# User Management Views
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def list(self, request, *args, **kwargs):
        logger.info("Fetching list of users")
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        user_id = kwargs.get("pk")
        logger.debug(f"Fetching user with ID: {user_id}")
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        logger.info(f"Creating a new user with data: {request.data}")
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        user_id = kwargs.get("pk")
        logger.info(f"Updating user with ID: {user_id} with data: {request.data}")
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        user_id = kwargs.get("pk")
        logger.warning(f"Deleting user with ID: {user_id}")
        return super().destroy(request, *args, **kwargs)

    def handle_exception(self, exc):
        logger.error(f"An error occurred in UserViewSet: {exc}", exc_info=True)
        return super().handle_exception(exc)


# Profile Management Views
class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer

    def list(self, request, *args, **kwargs):
        logger.info("Fetching list of profiles")
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        profile_id = kwargs.get("pk")
        logger.debug(f"Fetching profile with ID: {profile_id}")
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        logger.info(f"Creating a new profile with data: {request.data}")
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        profile_id = kwargs.get("pk")
        logger.info(f"Updating profile with ID: {profile_id} with data: {request.data}")
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        profile_id = kwargs.get("pk")
        logger.warning(f"Deleting profile with ID: {profile_id}")
        return super().destroy(request, *args, **kwargs)

    def handle_exception(self, exc):
        logger.error(f"An error occurred in ProfileViewSet: {exc}", exc_info=True)
        return super().handle_exception(exc)


# Post Management Views
class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer

    def list(self, request, *args, **kwargs):
        logger.info("Fetching list of posts")
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        post_id = kwargs.get("pk")
        logger.debug(f"Fetching post with ID: {post_id}")
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        logger.info(f"Creating a new post with data: {request.data}")
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        post_id = kwargs.get("pk")
        logger.info(f"Updating post with ID: {post_id} with data: {request.data}")
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        post_id = kwargs.get("pk")
        logger.warning(f"Deleting post with ID: {post_id}")
        return super().destroy(request, *args, **kwargs)

    def handle_exception(self, exc):
        logger.error(f"An error occurred in PostViewSet: {exc}", exc_info=True)
        return super().handle_exception(exc)


# Message Management Views
class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer

    def list(self, request, *args, **kwargs):
        logger.info("Fetching list of messages")
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        message_id = kwargs.get("pk")
        logger.debug(f"Fetching message with ID: {message_id}")
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        logger.info(f"Creating a new message with data: {request.data}")
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        message_id = kwargs.get("pk")
        logger.info(f"Updating message with ID: {message_id} with data: {request.data}")
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        message_id = kwargs.get("pk")
        logger.warning(f"Deleting message with ID: {message_id}")
        return super().destroy(request, *args, **kwargs)

    def handle_exception(self, exc):
        logger.error(f"An error occurred in MessageViewSet: {exc}", exc_info=True)
        return super().handle_exception(exc)


# Spotify OAuth Views
@api_view(["GET"])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate="20/15m", block=True)
def spotify_login(request):
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)
    state = "".join(
        secrets.choice(string.ascii_letters + string.digits) for _ in range(16)
    )

    request.session["code_verifier"] = code_verifier
    request.session["state"] = state

    authorize_url = (
        "https://accounts.spotify.com/authorize"
        f"?response_type=code"
        f"&client_id={settings.SPOTIFY_CLIENT_ID}"
        f"&redirect_uri={settings.SPOTIFY_REDIRECT_URI}"
        f"&scope={settings.SPOTIFY_SCOPE}"
        f"&state={state}"
        f"&code_challenge={code_challenge}"
        f"&code_challenge_method=S256"
    )

    return redirect(authorize_url)


@api_view(["GET"])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate="20/15m", block=True)
def spotify_callback(request):
    error = request.GET.get("error")
    if error:
        return JsonResponse({"error": error}, status=400)

    code = request.GET.get("code")
    state = request.GET.get("state")

    if state != request.session.get("state"):
        return JsonResponse({"error": "Invalid state parameter"}, status=400)

    code_verifier = request.session.get("code_verifier")

    if not code_verifier:
        return JsonResponse({"error": "Code verifier missing in session"}, status=400)

    token_url = "https://accounts.spotify.com/api/token"
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": settings.SPOTIFY_REDIRECT_URI,
        "client_id": settings.SPOTIFY_CLIENT_ID,
        "code_verifier": code_verifier,
    }
    auth_header = (
        settings.SPOTIFY_CLIENT_ID + ":" + settings.SPOTIFY_CLIENT_SECRET
    ).encode("utf-8")
    auth_header = base64.urlsafe_b64encode(auth_header).decode("utf-8")

    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": f"Basic {auth_header}",
    }

    response = requests.post(token_url, data=data, headers=headers)

    if response.status_code != 200:
        return JsonResponse(
            {"error": "Failed to obtain access token"}, status=response.status_code
        )

    token_data = response.json()
    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")

    if not access_token or not refresh_token:
        return JsonResponse({"error": "Invalid token data"}, status=400)

    request.session["access_token"] = access_token
    request.session["refresh_token"] = refresh_token

    del request.session["code_verifier"]
    del request.session["state"]

    return redirect("/spotifyAuth/profile")


@api_view(["GET"])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate="20/15m", block=True)
def spotify_profile(request):
    access_token = request.session.get("access_token")
    if not access_token:
        return JsonResponse(
            {"error": "Access token missing. Please log in again."}, status=401
        )

    headers = {
        "Authorization": f"Bearer {access_token}",
    }

    top_artists_url = "https://api.spotify.com/v1/me/top/artists?limit=10"
    top_tracks_url = "https://api.spotify.com/v1/me/top/tracks?limit=20"
    currently_playing_url = "https://api.spotify.com/v1/me/player/currently-playing"

    try:
        top_artists_response = requests.get(top_artists_url, headers=headers)
        top_artists_response.raise_for_status()
        top_artists_data = top_artists_response.json()

        top_tracks_response = requests.get(top_tracks_url, headers=headers)
        top_tracks_response.raise_for_status()
        top_tracks_data = top_tracks_response.json()

        currently_playing_response = requests.get(
            currently_playing_url, headers=headers
        )
        if currently_playing_response.status_code == 204:
            current_track_data = None
        else:
            currently_playing_response.raise_for_status()
            current_track_data = currently_playing_response.json()

        profile_data = {
            "top_artists": [
                {
                    "name": bleach.clean(artist["name"]),
                    "uri": bleach.clean(artist["uri"]),
                    "genres": [
                        bleach.clean(genre) for genre in artist.get("genres", [])
                    ],
                }
                for artist in top_artists_data.get("items", [])
            ],
            "top_tracks": [
                {
                    "name": bleach.clean(track["name"]),
                    "uri": bleach.clean(track["uri"]),
                    "album": bleach.clean(track["album"]["name"]),
                }
                for track in top_tracks_data.get("items", [])
            ],
            "currently_playing": (
                {
                    "name": bleach.clean(current_track_data["item"]["name"]),
                    "artist": ", ".join(
                        [
                            bleach.clean(artist["name"])
                            for artist in current_track_data["item"]["artists"]
                        ]
                    ),
                    "uri": bleach.clean(current_track_data["item"]["uri"]),
                    "album": bleach.clean(current_track_data["item"]["album"]["name"]),
                }
                if current_track_data and current_track_data.get("item")
                else None
            ),
        }

        return JsonResponse(profile_data, status=200)

    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to fetch Spotify profile data: {e}", exc_info=True)
        return JsonResponse({"error": "Failed to fetch profile data"}, status=500)


# Authentication Views
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            login(request, user)
            return Response({"message": "Login successful."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def logout_view(request):
    logout(request)
    return Response({"message": "Logout successful."}, status=status.HTTP_200_OK)


@api_view(["POST"])
def ai_response_view(request):
    prompt = request.data.get("prompt", "")
    if not prompt:
        return Response({"error": "Prompt is required."}, status=400)

    ai_response = get_openai_response(prompt)
    if ai_response:
        return Response({"response": ai_response})
    else:
        return Response({"error": "Failed to get response from OpenAI."}, status=500)


@api_view(["GET"])
def example_api_view(request):
    logger.info("Example API view accessed")
    data = {"message": "Hello from Django API"}
    return Response(data)


def handler500(request):
    return render(request, "core/500.html", status=500)


def test_logging(request):
    logger.info("This is an info message.")
    logger.error("This is an error message with password=secret&token=abcdef.")
    return JsonResponse({"message": "Logging test completed."})


def sanitize_input(html_input):
    cleaned_html = bleach.clean(html_input)
    return cleaned_html


def health_check(request):
    """
    A simple health check endpoint that returns a 200 OK response.

    This endpoint is typically used by load balancers, monitoring tools,
    or other services to verify that the application is running and responsive.

    Args:
        request (HttpRequest): The Django request object.

    Returns:
        JsonResponse: A JSON response with status "ok" and HTTP 200 status code.

    Example Response:
        {
            "status": "ok"
        }
    """
    return JsonResponse({"status": "ok"})


@csrf_exempt
def metrics(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            logger.info("Received web vitals metric: %s", data)
            # Optionally, save data to the database here
            return JsonResponse({"status": "success"}, status=201)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
    else:
        return JsonResponse({"error": "Only POST requests are allowed"}, status=405)
