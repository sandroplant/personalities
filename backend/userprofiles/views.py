# userprofiles/views.py

import os
import json
import spotipy
from functools import wraps
from django.shortcuts import redirect, render
from django.http import JsonResponse, HttpResponse
from django.views import View
from django.contrib.auth import login, authenticate, get_user_model
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from cloudinary import uploader
from spotipy.oauth2 import SpotifyOAuth
from .models import Profile, SpotifyProfile
from .serializers import ProfileSerializer


User = get_user_model()


# Middleware for user authentication
def ensure_authenticated(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse(
                {"error": "User not authenticated"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return view_func(request, *args, **kwargs)

    return _wrapped_view


# User Registration
@api_view(["POST"])
def register_user(request):
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")

    if not username or not email or not password:
        return JsonResponse(
            {"error": "All fields are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate email uniqueness
    if User.objects.filter(email=email).exists():
        return JsonResponse(
            {"error": "User already exists"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Create user with Django's built-in helper
    User.objects.create_user(username=username, email=email, password=password)

    return JsonResponse(
        {"message": "User registered successfully"},
        status=status.HTTP_201_CREATED,
    )


# User Login
@api_view(["POST"])
def login_user(request):
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
            {"error": "Invalid credentials"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Create a session for the user
    login(request, user)

    return JsonResponse(
        {"message": "Login successful"},
        status=status.HTTP_200_OK,
    )


# Get User Profile
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    user = request.user
    profile = Profile.objects.filter(user=user).first()

    if not profile:
        return JsonResponse(
            {"error": "Profile not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = ProfileSerializer(profile)
    return Response(serializer.data)


# Update User Profile
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    user = request.user
    profile_data = request.data

    profile, _ = Profile.objects.get_or_create(user=user)

    # Update profile fields
    for field, value in profile_data.items():
        setattr(profile, field, value)

    profile.save()
    return JsonResponse({"message": "Profile updated successfully"})


# Delete User Profile
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_user_profile(request):
    user = request.user
    Profile.objects.filter(user=user).delete()
    return JsonResponse(
        {"message": "Profile deleted successfully"},
        status=status.HTTP_204_NO_CONTENT,
    )


# Spotify Authentication Views for OAuth Flow Integration


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

    # Save the access token in the session
    request.session["spotify_token_info"] = token_info

    return redirect("spotify_profile")


def get_user_spotify_profile(request):
    token_info = request.session.get("spotify_token_info")
    if not token_info:
        return redirect("spotify_login")

    spotify = spotipy.Spotify(auth=token_info["access_token"])
    user_profile = spotify.current_user()

    return render(
        request,
        "userprofiles/profile.html",
        {"profile": user_profile},
    )


# Upload Profile Picture
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_profile_picture(request):
    if "profilePicture" not in request.FILES:
        return JsonResponse(
            {"error": "No file uploaded"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        file = request.FILES["profilePicture"]
        result = uploader.upload(file, folder="profile_pictures")
        # Update the user's profile picture URL
        profile = Profile.objects.get(user=request.user)
        profile.profile_picture = result["secure_url"]
        profile.save()
        return JsonResponse(
            {"url": result["secure_url"]},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        print("Cloudinary Upload Error:", e)
        return JsonResponse(
            {"error": "Failed to upload profile picture"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# Fetch Spotify Profile Data and Update or Create SpotifyProfile
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def fetch_spotify_profile(request):
    token_info = request.session.get("spotify_token_info")
    if not token_info:
        return JsonResponse(
            {"error": "Access token missing"},
            status=401,
        )

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


# Profile View (if needed)
class ProfileView(View):
    @method_decorator(login_required)
    def get(self, request):
        user = request.user
        profile = Profile.objects.filter(user=user).first()

        if not profile:
            return JsonResponse(
                {"error": "Profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ProfileSerializer(profile)
        return JsonResponse(serializer.data, safe=False)

    @method_decorator(login_required)
    def post(self, request):
        user = request.user
        data = json.loads(request.body)

        profile, _ = Profile.objects.get_or_create(user=user)

        # Update profile fields
        for field, value in data.items():
            setattr(profile, field, value)

        profile.save()
        return JsonResponse({"message": "Profile updated successfully"})
