import React, { useState, ChangeEvent } from 'react';
import { Container, Form, Row, Col, Button } from 'react-bootstrap';

interface CriteriaOptions {
  [key: string]: string;
}

interface SearchParams {
  selectedCriteria: {
    [key: string]: number;
  };
  spotifyData: {
    topArtists: string[];
    topSongs: string[];
    currentSong: string;
  };
  favoriteMovies: string[];
  favoriteBooks: string[];
  appearance: {
    hairColor: string;
    eyeColor: string;
    height: string;
    weight: string;
    bodyType: string;
  };
  hobbies: string[];
  interests: string[];
  profession: string;
  education: string;
}

interface SearchEngineProps {
  criteriaOptions: CriteriaOptions;
}

const SearchEngine: React.FC<SearchEngineProps> = ({ criteriaOptions }) => {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    selectedCriteria: {},
    spotifyData: { topArtists: [], topSongs: [], currentSong: '' },
    favoriteMovies: [],
    favoriteBooks: [],
    appearance: {
      hairColor: '',
      eyeColor: '',
      height: '',
      weight: '',
      bodyType: '',
    },
    hobbies: [],
    interests: [],
    profession: '',
    education: '',
  });

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSearchParams((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleCriteriaChange = (criteriaName: string, value: number) => {
    setSearchParams((prevState) => ({
      ...prevState,
      selectedCriteria: {
        ...prevState.selectedCriteria,
        [criteriaName]: value,
      },
    }));
  };

  const handleSearch = () => {
    console.log('Search parameters:', searchParams);
  };

  return (
    <Container className="mt-5">
      <h2>Search Profiles</h2>
      <Form>
        {/* Criteria Selection */}
        <Row>
          {Object.keys(criteriaOptions).map((criteria, index) => (
            <Col md={6} key={index}>
              <Form.Group controlId={criteria}>
                <Form.Label>{criteria}</Form.Label>
                <Form.Control
                  type="range"
                  min="1"
                  max="10"
                  step="0.1"
                  value={searchParams.selectedCriteria[criteria] || 1}
                  onChange={(e) =>
                    handleCriteriaChange(criteria, Number(e.target.value))
                  }
                />
              </Form.Group>
            </Col>
          ))}
        </Row>

        {/* Spotify Data */}
        <Form.Group controlId="spotifyData">
          <Form.Label>Top Artists</Form.Label>
          <Form.Control
            as="select"
            name="topArtists"
            onChange={handleInputChange}
          >
            {searchParams.spotifyData.topArtists.map((artist, index) => (
              <option key={index} value={artist}>
                {artist}
              </option>
            ))}
          </Form.Control>

          <Form.Label>Top Songs</Form.Label>
          <Form.Control
            as="select"
            name="topSongs"
            onChange={handleInputChange}
          >
            {searchParams.spotifyData.topSongs.map((song, index) => (
              <option key={index} value={song}>
                {song}
              </option>
            ))}
          </Form.Control>

          <Form.Label>Current Song</Form.Label>
          <Form.Control
            type="text"
            name="currentSong"
            value={searchParams.spotifyData.currentSong}
            onChange={handleInputChange}
          />
        </Form.Group>

        {/* Favorite Movies */}
        <Form.Group controlId="favoriteMovies">
          <Form.Label>Favorite Movies</Form.Label>
          <Form.Control
            type="text"
            name="favoriteMovies"
            value={searchParams.favoriteMovies.join(', ')}
            onChange={handleInputChange}
          />
        </Form.Group>

        {/* Favorite Books */}
        <Form.Group controlId="favoriteBooks">
          <Form.Label>Favorite Books</Form.Label>
          <Form.Control
            type="text"
            name="favoriteBooks"
            value={searchParams.favoriteBooks.join(', ')}
            onChange={handleInputChange}
          />
        </Form.Group>

        {/* Appearance */}
        <Row>
          <Col md={6}>
            <Form.Group controlId="hairColor">
              <Form.Label>Hair Color</Form.Label>
              <Form.Control
                as="select"
                name="hairColor"
                onChange={handleInputChange}
              >
                {/* Add options for hair colors */}
              </Form.Control>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="eyeColor">
              <Form.Label>Eye Color</Form.Label>
              <Form.Control
                as="select"
                name="eyeColor"
                onChange={handleInputChange}
              >
                {/* Add options for eye colors */}
              </Form.Control>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="height">
              <Form.Label>Height</Form.Label>
              <Form.Control
                type="number"
                name="height"
                value={searchParams.appearance.height}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="weight">
              <Form.Label>Weight</Form.Label>
              <Form.Control
                type="number"
                name="weight"
                value={searchParams.appearance.weight}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="bodyType">
              <Form.Label>Body Type</Form.Label>
              <Form.Control
                as="select"
                name="bodyType"
                onChange={handleInputChange}
              >
                {/* Add options for body types */}
              </Form.Control>
            </Form.Group>
          </Col>
        </Row>

        {/* Hobbies */}
        <Form.Group controlId="hobbies">
          <Form.Label>Hobbies</Form.Label>
          <Form.Control
            type="text"
            name="hobbies"
            value={searchParams.hobbies.join(', ')}
            onChange={handleInputChange}
          />
        </Form.Group>

        {/* Interests */}
        <Form.Group controlId="interests">
          <Form.Label>Interests</Form.Label>
          <Form.Control
            type="text"
            name="interests"
            value={searchParams.interests.join(', ')}
            onChange={handleInputChange}
          />
        </Form.Group>

        {/* Profession */}
        <Form.Group controlId="profession">
          <Form.Label>Profession</Form.Label>
          <Form.Control
            type="text"
            name="profession"
            value={searchParams.profession}
            onChange={handleInputChange}
          />
        </Form.Group>

        {/* Education */}
        <Form.Group controlId="education">
          <Form.Label>Education</Form.Label>
          <Form.Control
            type="text"
            name="education"
            value={searchParams.education}
            onChange={handleInputChange}
          />
        </Form.Group>

        <Button variant="primary" onClick={handleSearch} className="mt-3">
          Search
        </Button>
      </Form>
    </Container>
  );
};

export default SearchEngine;
