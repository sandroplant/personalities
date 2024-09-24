import React, { useEffect, useState } from 'react';
import { getSpotifyData } from '../utils/spotify'; // Ensure this path is correct

const UserProfile = () => {
  const [spotifyData, setSpotifyData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getSpotifyData();
        setSpotifyData(data);
      } catch (error) {
        console.error('Error fetching Spotify data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {/* Existing profile code */}
      <h2>Spotify Information</h2>
      {spotifyData && (
        <div>
          <h3>Top 10 Artists</h3>
          <ul>
            {spotifyData.topArtists.map((artist) => (
              <li key={artist.id}>{artist.name}</li>
            ))}
          </ul>
          <h3>Top 20 Tracks</h3>
          <ul>
            {spotifyData.topTracks.map((track) => (
              <li key={track.id}>{track.name} by {track.artists[0].name}</li>
            ))}
          </ul>
          <h3>Currently Playing</h3>
          {spotifyData.currentlyPlaying ? (
            <div>
              <p>Track: {spotifyData.currentlyPlaying.name}</p>
              <p>Artist: {spotifyData.currentlyPlaying.artists[0].name}</p>
            </div>
          ) : (
            <p>No track is currently playing.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfile;
