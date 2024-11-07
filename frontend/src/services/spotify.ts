// frontend/src/services/spotify.ts

import api from '@services/api';
import { SpotifyData } from '@typeDefs/spotify'; // Should now resolve correctly

/**
 * Fetches Spotify data from the backend API.
 * @returns {Promise<SpotifyData>} The Spotify data.
 */
export const getSpotifyData = async (): Promise<SpotifyData> => {
  try {
    const response = await api.get<SpotifyData>('/spotify-data/');
    return response.data;
  } catch (error) {
    console.error('Error fetching Spotify data:', error);
    throw error; // Let the hook handle the error
  }
};
