import axios from 'axios';

const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const ACCESS_TOKEN = 'YOUR_SPOTIFY_ACCESS_TOKEN'; // Replace with actual token

export const getSpotifyData = async () => {
  try {
    const { data: topArtists } = await axios.get(`${SPOTIFY_API_URL}/me/top/artists`, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });

    const { data: topTracks } = await axios.get(`${SPOTIFY_API_URL}/me/top/tracks`, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });

    const { data: currentlyPlaying } = await axios.get(`${SPOTIFY_API_URL}/me/player/currently-playing`, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });

    return {
      topArtists: topArtists.items,
      topTracks: topTracks.items,
      currentlyPlaying: currentlyPlaying.item,
    };
  } catch (error) {
    console.error('Error fetching Spotify data:', error);
    throw error;
  }
};
