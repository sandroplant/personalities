import os
from django.conf import settings
import spotipy
from spotipy.oauth2 import SpotifyOAuth

# Retrieve Spotify credentials from Django settings or environment variables
SPOTIFY_CLIENT_ID = getattr(settings, "SPOTIFY_CLIENT_ID", None) or os.getenv(
    "SPOTIFY_CLIENT_ID"
)
SPOTIFY_CLIENT_SECRET = getattr(settings, "SPOTIFY_CLIENT_SECRET", None) or os.getenv(
    "SPOTIFY_CLIENT_SECRET"
)
SPOTIFY_REDIRECT_URI = getattr(settings, "SPOTIFY_REDIRECT_URI", None) or os.getenv(
    "SPOTIFY_REDIRECT_URI"
)


def get_spotify_client(request):
    """
    Returns a Spotify client authorized for the current user session.
    If the required client credentials are missing, returns None instead
    of raising an exception. This allows the application to start even if
    Spotify integration is not configured.
    """
    if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET or not SPOTIFY_REDIRECT_URI:
        return None

    token_info = request.session.get("spotify_token_info")
    if not token_info:
        return None

    auth_manager = SpotifyOAuth(
        client_id=SPOTIFY_CLIENT_ID,
        client_secret=SPOTIFY_CLIENT_SECRET,
        redirect_uri=SPOTIFY_REDIRECT_URI,
        scope="user-read-private user-read-email",
    )
    auth_manager.cache_handler.token_info = token_info

    # Refresh token if expired
    if auth_manager.is_token_expired(token_info):
        token_info = auth_manager.refresh_access_token(token_info["refresh_token"])
        request.session["spotify_token_info"] = token_info

    return spotipy.Spotify(auth_manager=auth_manager)
