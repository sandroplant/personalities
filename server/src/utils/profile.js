import axios from 'axios';

const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

export const getSpotifyData = async (accessToken) => {
  try {
    const { data: topArtists } = await axios.get(
      `${SPOTIFY_API_URL}/me/top/artists`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const { data: topTracks } = await axios.get(
      `${SPOTIFY_API_URL}/me/top/tracks`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const { data: currentlyPlaying } = await axios.get(
      `${SPOTIFY_API_URL}/me/player/currently-playing`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    return {
      topArtists: topArtists.items,
      topTracks: topTracks.items,
      currentlyPlaying: currentlyPlaying.item
    };
  } catch (error) {
    console.error('Error fetching Spotify data:', error);
    throw error;
  }
};
