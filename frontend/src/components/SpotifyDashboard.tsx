// src/components/SpotifyDashboard.tsx

import React from 'react';
import useSpotifyData from '../hooks/useSpotifyData';

const SpotifyDashboard: React.FC = () => {
  const { data, loading, error } = useSpotifyData();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Top Artists</h2>
      <ul>
        {data?.topArtists.map((artist: { id: string; name: string }) => (
          <li key={artist.id}>{artist.name}</li>
        ))}
      </ul>

      <h2>Top Tracks</h2>
      <ul>
        {data?.topTracks.map(
          (track: {
            id: string;
            name: string;
            artists: { name: string }[];
          }) => (
            <li key={track.id}>
              {track.name} by{' '}
              {track.artists.map((artist) => artist.name).join(', ')}
            </li>
          )
        )}
      </ul>

      {data?.currentlyPlaying && (
        <div>
          <h3>Currently Playing</h3>
          <p>
            {data.currentlyPlaying.name} by{' '}
            {data.currentlyPlaying.artists
              .map((artist: { name: string }) => artist.name)
              .join(', ')}
          </p>
        </div>
      )}
    </div>
  );
};

export default SpotifyDashboard;
