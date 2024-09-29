// src/utils/profile.js

import axios from 'axios';

const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

export const getSpotifyData = async (accessToken) => {
    try {
        const headers = {
            Authorization: `Bearer ${accessToken}`,
        };

        const [topArtistsResponse, topTracksResponse, currentlyPlayingResponse] = await Promise.all([
            axios.get(`${SPOTIFY_API_URL}/me/top/artists`, { headers }),
            axios.get(`${SPOTIFY_API_URL}/me/top/tracks`, { headers }),
            axios.get(`${SPOTIFY_API_URL}/me/player/currently-playing`, { headers }),
        ]);

        return {
            topArtists: Array.isArray(topArtistsResponse.data.items) ? topArtistsResponse.data.items : [],
            topTracks: Array.isArray(topTracksResponse.data.items) ? topTracksResponse.data.items : [],
            currentlyPlaying: currentlyPlayingResponse.data.item || null,
        };
    } catch (error) {
        console.error('Error fetching Spotify data:', error);
        throw error;
    }
};
