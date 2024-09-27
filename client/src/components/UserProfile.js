import React, { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  ListGroup,
  Spinner,
  Alert,
} from 'react-bootstrap';
import { getSpotifyData } from '../utils/spotify.js';

const UserProfile = () => {
  const [spotifyData, setSpotifyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getSpotifyData();
        setSpotifyData(data);
        setError('');
      } catch (err) {
        console.error('Error fetching Spotify data:', err);
        setError('Failed to fetch Spotify data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Container className="mt-5">
      {/* Existing profile code */}
      <h2>Spotify Information</h2>
      {loading && <Spinner animation="border" />}
      {error && <Alert variant="danger">{error}</Alert>}
      {spotifyData && (
        <div>
          <Row>
            <Col md={6}>
              <h3>Top 10 Artists</h3>
              <ListGroup>
                {spotifyData.topArtists.map((artist) => (
                  <ListGroup.Item key={artist.id}>{artist.name}</ListGroup.Item>
                ))}
              </ListGroup>
            </Col>
            <Col md={6}>
              <h3>Top 20 Tracks</h3>
              <ListGroup>
                {spotifyData.topTracks.map((track) => (
                  <ListGroup.Item key={track.id}>
                    {track.name} by {track.artists[0].name}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col>
              <h3>Currently Playing</h3>
              {spotifyData.currentlyPlaying ? (
                <div>
                  <p>Track: {spotifyData.currentlyPlaying.name}</p>
                  <p>Artist: {spotifyData.currentlyPlaying.artists[0].name}</p>
                </div>
              ) : (
                <p>No track is currently playing.</p>
              )}
            </Col>
          </Row>
        </div>
      )}
    </Container>
  );
};

export default UserProfile;
