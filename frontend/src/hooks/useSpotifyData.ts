// src/hooks/useSpotifyData.ts

import { useEffect, useState } from 'react';
import { getSpotifyData } from '@services/spotify';
import { SpotifyData } from '@typeDefs/spotify';

const useSpotifyData = () => {
  const [data, setData] = useState<SpotifyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchSpotifyData = async () => {
      try {
        const spotifyData = await getSpotifyData();
        setData(spotifyData);
        setError('');
      } catch (err) {
        console.error('Error fetching Spotify data:', err);
        setError('Failed to fetch Spotify data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSpotifyData();
  }, []);

  return { data, loading, error };
};

export default useSpotifyData;
