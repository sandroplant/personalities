# spotify_auth/views.py

import requests
from django.http import JsonResponse, HttpResponseRedirect
from rest_framework.decorators import api_view
from rest_framework import status
from django.conf import settings
from urllib.parse import urlencode
from .spotify_auth_utils import generate_code_verifier, generate_code_challenge
import uuid

# Constants for Spotify
SPOTIFY_CLIENT_ID = settings.SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET = settings.SPOTIFY_CLIENT_SECRET
REDIRECT_URI = settings.SPOTIFY_REDIRECT_URI


@api_view(["GET"])
def login(request):
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)

    # Store code_verifier in session
    request.session["code_verifier"] = code_verifier

    # Generate a random state parameter and store it in session
    state = str(uuid.uuid4())
    request.session["oauth_state"] = state

    # Construct authorization URL
    authorization_url = "https://accounts.spotify.com/authorize?" + urlencode(
        {
            "response_type": "code",
            "client_id": SPOTIFY_CLIENT_ID,
            "redirect_uri": REDIRECT_URI,
            "scope": "user-read-private user-read-email",
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
            "state": state,
        }
    )

    # Redirect to Spotify's authorization page
    return HttpResponseRedirect(authorization_url)


@api_view(["GET"])
def callback(request):
    # Validate the presence of required query parameters
    code = request.GET.get("code")
    state = request.GET.get("state")

    if not code or not isinstance(code, str):
        return JsonResponse(
            {"error": "Code is required and must be a string"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Verify state parameter
    session_state = request.session.get("oauth_state")
    if not session_state or state != session_state:
        return JsonResponse(
            {"error": "Invalid state parameter"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Remove state from session
    request.session.pop("oauth_state", None)

    # Retrieve code_verifier from session
    code_verifier = request.session.get("code_verifier")
    if not code_verifier:
        return JsonResponse(
            {"error": "Missing code verifier"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Exchange code for access token
        response = requests.post(
            "https://accounts.spotify.com/api/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": REDIRECT_URI,
                "code_verifier": code_verifier,
                "client_id": SPOTIFY_CLIENT_ID,
                "client_secret": SPOTIFY_CLIENT_SECRET,
            },
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
            },
        )

        data = response.json()
        access_token = data.get("access_token")

        # Clear code_verifier from session after successful use
        request.session.pop("code_verifier", None)

        # Store access token in session
        request.session["access_token"] = access_token

        return JsonResponse(
            {"message": "Successfully authenticated with Spotify"},
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        return JsonResponse(
            {"error": f"Error during token exchange: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
