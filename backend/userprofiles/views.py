# userprofiles/views.py

from __future__ import annotations

import json
import os
from functools import wraps

from django.contrib.auth import authenticate, get_user_model, login
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.utils.decorators import method_decorator
from django.views import View

import spotipy
from cloudinary import uploader
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from spotipy.oauth2 import SpotifyOAuth

from .models import Profile, SpotifyProfile
from .serializers import ProfileSerializer


# Middleware for user authentication
def ensure_authenticated(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse(
                {"error": "User not authenticated"}, status=status.HTTP_401_UNAUTHORIZED
            )
        return view_func(request, *args, **kwargs)

    return _wrapped_view


# -----------------------
# Auth Endpoints (DRF)
# -----------------------


@api_view(["POST"])
def register_user(request):
    """
    Registers a user using the active custom user model (core.User).
    Expects: {username, email, password}
    Returns 201 on success.
    """
    User = get_user_model()
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")

    if not username or not email or not password:
        return JsonResponse(
            {"error": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Uniqueness checks (both username and email)
    if User.objects.filter(username=username).exists():
        return JsonResponse(
            {"error": "Username already taken"}, status=status.HTTP_400_BAD_REQUEST
        )
    if User.objects.filter(email=email).exists():
        return JsonResponse(
            {"error": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Proper hashing via create_user()
    user = User.objects.create_user(username=username, email=email, password=password)

    return JsonResponse(
        {"message": "User registered successfully", "id": user.id},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
def login_user(request):
    """
    Logs in a user with username + password (as tests expect).
    Expects: {username, password}
    Returns 200 on success.
    """
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return JsonResponse(
            {"error": "Username and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request, username=username, password=password)
    if not user:
        return JsonResponse(
            {"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST
        )

    login(request, user)
    return JsonResponse({"message": "Login successful"}, status=status.HTTP_200_OK)


# -----------------------
# Profile Endpoints (DRF)
# -----------------------


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    user = request.user
    profile = Profile.objects.filter(user=user).first()

    if not profile:
        return JsonResponse(
            {"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND
        )

    serializer = ProfileSerializer(profile)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    user = request.user
    profile_data = request.data

    profile, _ = Profile.objects.get_or_create(user=user)

    # Update profile fields
    for field, value in profile_data.items():
        if hasattr(profile, field):
            setattr(profile, field, value)

    profile.save()
    return JsonResponse({"message": "Profile updated successfully"})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_user_profile(request):
    user = request.user
    Profile.objects.filter(user=user).delete()
    return JsonResponse(
        {"message": "Profile deleted successfully"}, status=status.HTTP_204_NO_CONTENT
    )


# -----------------------
# Spotify OAuth Flow
# -----------------------


def spotify_login(request):
    sp_oauth = SpotifyOAuth(
        client_id=os.getenv("SPOTIFY_CLIENT_ID"),
        client_secret=os.getenv("SPOTIFY_CLIENT_SECRET"),
        redirect_uri=os.getenv("SPOTIFY_REDIRECT_URI"),
        scope="user-read-private user-read-email",
    )
    auth_url = sp_oauth.get_authorize_url()
    return redirect(auth_url)


def spotify_callback(request):
    code = request.GET.get("code")
    if not code:
        return HttpResponse("Authorization failed.", status=401)
    sp_oauth = SpotifyOAuth(
        client_id=os.getenv("SPOTIFY_CLIENT_ID"),
        client_secret=os.getenv("SPOTIFY_CLIENT_SECRET"),
        redirect_uri=os.getenv("SPOTIFY_REDIRECT_URI"),
    )
    token_info = sp_oauth.get_access_token(code)
    # Store for later API calls
    request.session["spotify_token_info"] = token_info
    return redirect("spotify_profile")


def get_user_spotify_profile(request):
    token_info = request.session.get("spotify_token_info")
    if not token_info:
        return redirect("spotify_login")

    spotify = spotipy.Spotify(auth=token_info["access_token"])
    user_profile = spotify.current_user()

    return render(request, "userprofiles/profile.html", {"profile": user_profile})


# -----------------------
# Media Upload (Cloudinary)
# -----------------------


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_profile_picture(request):
    if "profilePicture" not in request.FILES:
        return JsonResponse(
            {"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        file = request.FILES["profilePicture"]
        result = uploader.upload(file, folder="profile_pictures")
        # Update the user's profile picture URL
        profile, _ = Profile.objects.get_or_create(user=request.user)
        profile.profile_picture = result["secure_url"]
        profile.save()
        return JsonResponse({"url": result["secure_url"]}, status=status.HTTP_200_OK)
    except Exception:
        return JsonResponse(
            {"error": "Failed to upload profile picture"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# -----------------------
# SpotifyProfile sync
# -----------------------


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def fetch_spotify_profile(request):
    token_info = request.session.get("spotify_token_info")
    if not token_info:
        return JsonResponse({"error": "Access token missing"}, status=401)

    spotify = spotipy.Spotify(auth=token_info["access_token"])
    profile_data = spotify.current_user()

    # Update or create SpotifyProfile
    spotify_profile, _ = SpotifyProfile.objects.update_or_create(
        user=request.user,
        defaults={
            "display_name": profile_data.get("display_name", ""),
            "email": profile_data.get("email", ""),
            "images": profile_data.get("images", []),
        },
    )

    return JsonResponse(profile_data, status=status.HTTP_200_OK)


# -----------------------
# Django-class-based Profile View (optional)
# -----------------------


class ProfileView(View):
    @method_decorator(login_required)
    def get(self, request):
        user = request.user
        profile = Profile.objects.filter(user=user).first()

        if not profile:
            return JsonResponse(
                {"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = ProfileSerializer(profile)
        return JsonResponse(serializer.data, safe=False)

    @method_decorator(login_required)
    def post(self, request):
        user = request.user
        try:
            data = json.loads(request.body or "{}")
        except Exception:
            data = {}

        profile, _ = Profile.objects.get_or_create(user=user)

        for field, value in data.items():
            if hasattr(profile, field):
                setattr(profile, field, value)

        profile.save()
        return JsonResponse({"message": "Profile updated successfully"})
