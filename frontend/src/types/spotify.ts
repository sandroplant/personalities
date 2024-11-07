// frontend/src/types/spotify.ts

export interface SpotifyArtist {
  id: string;
  name: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
}

export interface CurrentlyPlaying {
  name: string;
  artists: SpotifyArtist[];
}

export interface SpotifyData {
  topArtists: SpotifyArtist[];
  topTracks: SpotifyTrack[];
  currentlyPlaying?: CurrentlyPlaying | null;
}
