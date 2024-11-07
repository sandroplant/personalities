// frontend/src/tests/pathAliasTest.ts

import { SpotifyData } from '@typeDefs/spotify';
import { getSpotifyData } from '@services/spotify';

const testData: SpotifyData = {
  topArtists: [
    { id: '1', name: 'Artist One' },
    { id: '2', name: 'Artist Two' },
  ],
  topTracks: [
    {
      id: '101',
      name: 'Track One',
      artists: [{ id: 'a1', name: 'Artist One' }],
    },
  ],
  currentlyPlaying: {
    name: 'Track One',
    artists: [{ id: 'a1', name: 'Artist One' }],
  },
};

console.log(testData);

// Test fetching data
getSpotifyData()
  .then((data) => console.log(data))
  .catch((err) => console.error(err));
