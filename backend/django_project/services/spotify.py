# services/spotify.py

import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth

# Retrieve Spotify credentials from environment variables
SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
SPOTIFY_CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')
SPOTIFY_REDIRECT_URI = os.getenv('SPOTIFY_REDIRECT_URI')

# Check that all necessary credentials are present
if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET or not SPOTIFY_REDIRECT_URI:
    raise Exception(
        'Missing Spotify environment variables. Please ensure SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, and SPOTIFY_REDIRECT_URI are set.'
    )

# Function to get Spotify client
def get_spotify_client(request):
    token_info = request.session.get('spotify_token_info')
    if not token_info:
        return None

    auth_manager = SpotifyOAuth(
        client_id=SPOTIFY_CLIENT_ID,
        client_secret=SPOTIFY_CLIENT_SECRET,
        redirect_uri=SPOTIFY_REDIRECT_URI,
        scope='user-read-private user-read-email',
    )
    auth_manager.cache_handler.token_info = token_info

    # Check if token is expired
    if auth_manager.is_token_expired(token_info):
        token_info = auth_manager.refresh_access_token(token_info['refresh_token'])
        request.session['spotify_token_info'] = token_info

    return spotipy.Spotify(auth_manager=auth_manager)

    # Check if token is expired
    if auth_manager.is_token_expired(token_info):
        token_info = auth_manager.refresh_access_token(token_info['refresh_token'])
        request.session['spotify_token_info'] = token_info

    return spotipy.Spotify(auth_manager=auth_manager)
