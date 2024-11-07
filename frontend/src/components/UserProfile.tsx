// src/components/UserProfile.tsx

import React from 'react';
import {
  Container,
  Row,
  Col,
  ListGroup,
  Spinner,
  Alert,
} from 'react-bootstrap';
import useSpotifyData from '@hooks/useSpotifyData';

const UserProfile: React.FC = () => {
  const { data: spotifyData, loading, error } = useSpotifyData();

  return (
    <Container className="mt-5">
      <h2>Spotify Information</h2>

      {/* Loading State */}
      {loading && (
        <div className="d-flex justify-content-center my-3">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}

      {/* Error State */}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Data Display */}
      {spotifyData && (
        <div>
          <Row>
            {/* Top Artists */}
            <Col md={6}>
              <h3>Top Artists</h3>
              <ListGroup>
                {spotifyData.topArtists.map(
                  (artist: { id: string; name: string }) => (
                    <ListGroup.Item key={artist.id}>
                      {artist.name}
                    </ListGroup.Item>
                  )
                )}
              </ListGroup>
            </Col>

            {/* Top Tracks */}
            <Col md={6}>
              <h3>Top Tracks</h3>
              <ListGroup>
                {spotifyData.topTracks.map(
                  (track: {
                    id: string;
                    name: string;
                    artists: { name: string }[];
                  }) => (
                    <ListGroup.Item key={track.id}>
                      {track.name} by{' '}
                      {track.artists.map((artist) => artist.name).join(', ')}
                    </ListGroup.Item>
                  )
                )}
              </ListGroup>
            </Col>
          </Row>

          {/* Currently Playing */}
          <Row className="mt-3">
            <Col>
              <h3>Currently Playing</h3>
              {spotifyData.currentlyPlaying ? (
                <div>
                  <p>
                    <strong>Track:</strong> {spotifyData.currentlyPlaying.name}
                  </p>
                  <p>
                    <strong>Artist:</strong>{' '}
                    {spotifyData.currentlyPlaying.artists
                      .map((artist: { name: string }) => artist.name)
                      .join(', ')}
                  </p>
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
