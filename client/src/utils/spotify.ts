// src/utils/spotify.ts

export interface SpotifyData {
  topArtists: { id: string; name: string }[];
  topTracks: { id: string; name: string; artists: { name: string }[] }[];
  currentlyPlaying?: { name: string; artists: { name: string }[] } | null;
}

export const getSpotifyData = async (): Promise<SpotifyData> => {
  // Mock data for demonstration purposes
  return {
    topArtists: [
      { id: '1', name: 'Artist 1' },
      { id: '2', name: 'Artist 2' },
    ],
    topTracks: [
      { id: '1', name: 'Track 1', artists: [{ name: 'Artist 1' }] },
      { id: '2', name: 'Track 2', artists: [{ name: 'Artist 2' }] },
    ],
    currentlyPlaying: { name: 'Track 1', artists: [{ name: 'Artist 1' }] },
  };
};
