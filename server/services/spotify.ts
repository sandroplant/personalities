import SpotifyWebApi from 'spotify-web-api-node';
import dotenv from 'dotenv';
import '../src/config/env.js';

// Load environment variables
dotenv.config();

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI } =
    process.env;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REDIRECT_URI) {
    console.error(
        'Missing Spotify environment variables. Please ensure SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, and SPOTIFY_REDIRECT_URI are set.'
    );
    throw new Error('Missing Spotify environment variables.');
}

// Initialize Spotify API with credentials
const spotifyApi = new SpotifyWebApi({
    clientId: SPOTIFY_CLIENT_ID,
    clientSecret: SPOTIFY_CLIENT_SECRET,
    redirectUri: SPOTIFY_REDIRECT_URI,
});

export default spotifyApi;
