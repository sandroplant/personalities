import React from 'react';
import { Container, Row, Col, ListGroup } from 'react-bootstrap';

interface SpotifyInfoProps {
  user: {
    spotifyInfo: {
      topArtists: string[];
      topSongs: string[];
      currentSong: string;
      recentSong: string;
    };
  };
}

const SpotifyInfo: React.FC<SpotifyInfoProps> = ({ user }) => {
  const { topArtists, topSongs, currentSong, recentSong } = user.spotifyInfo;

  return (
    <Container className="mt-5">
      <h3>Spotify Information</h3>
      <Row>
        <Col md={6}>
          <h4>Top Artists</h4>
          <ListGroup>
            {topArtists.map((artist, index) => (
              <ListGroup.Item key={index}>{artist}</ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
        <Col md={6}>
          <h4>Top Songs</h4>
          <ListGroup>
            {topSongs.map((song, index) => (
              <ListGroup.Item key={index}>{song}</ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
      </Row>
      <Row className="mt-3">
        <Col md={6}>
          <h4>Current Song</h4>
          <p>{currentSong}</p>
        </Col>
        <Col md={6}>
          <h4>Recently Played Song</h4>
          <p>{recentSong}</p>
        </Col>
      </Row>
    </Container>
  );
};

export default SpotifyInfo;
