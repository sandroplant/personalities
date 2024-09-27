import React, { useState } from 'react';
import { Container, Form, Button, Row, Col } from 'react-bootstrap';
import options from '../config/options.js';

const ProfileForm = () => {
  const [profile, setProfile] = useState({
    fullName: '',
    bio: '',
    criteria: { humor: '', adventurousness: '' },
    spotifyInfo: { topArtists: [], topSongs: [], currentPlayback: '' },
    favoriteMovies: [],
    favoriteBooks: [],
    appearance: {
      eyeColor: '',
      height: '',
      weight: '',
      bodyType: '',
      hairColor: '',
      skinColor: '',
    },
    hobbies: [],
    interests: [],
    profession: '',
    education: '',
    privacySettings: {
      spotifyInfo: 'private',
      favoriteMovies: 'private',
      favoriteBooks: 'private',
      appearance: 'private',
      hobbies: 'private',
      interests: 'private',
      profession: 'private',
      education: 'private',
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  const handleCriteriaChange = (e) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      criteria: {
        ...prevProfile.criteria,
        [name]: value,
      },
    }));
  };

  const handleAppearanceChange = (e) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      appearance: {
        ...prevProfile.appearance,
        [name]: value,
      },
    }));
  };

  const handlePrivacyChange = (e) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      privacySettings: {
        ...prevProfile.privacySettings,
        [name]: value,
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Profile data saved:', profile);
  };

  return (
    <Container className="mt-5">
      <h1>Edit Profile</h1>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="fullName">
          <Form.Label>Full Name</Form.Label>
          <Form.Control
            type="text"
            name="fullName"
            value={profile.fullName}
            onChange={handleChange}
            placeholder="Full Name"
          />
        </Form.Group>

        <Form.Group controlId="bio">
          <Form.Label>Bio</Form.Label>
          <Form.Control
            as="textarea"
            name="bio"
            value={profile.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself"
          />
        </Form.Group>

        <Row>
          {Object.keys(profile.criteria).map((key) => (
            <Col md={6} key={key}>
              <Form.Group controlId={key}>
                <Form.Label>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Form.Label>
                <Form.Control
                  type="number"
                  name={key}
                  min="1"
                  max="10"
                  value={profile.criteria[key]}
                  onChange={handleCriteriaChange}
                />
              </Form.Group>
            </Col>
          ))}
        </Row>

        <Row>
          {Object.keys(profile.appearance).map((key) => (
            <Col md={6} key={key}>
              <Form.Group controlId={key}>
                <Form.Label>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Form.Label>
                <Form.Control
                  as="select"
                  name={key}
                  value={profile.appearance[key]}
                  onChange={handleAppearanceChange}
                >
                  <option value="">Select...</option>
                  {options[key] &&
                    options[key].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                </Form.Control>
              </Form.Group>
            </Col>
          ))}
        </Row>

        <Row>
          {['hobbies', 'interests'].map((key) => (
            <Col md={6} key={key}>
              <Form.Group controlId={key}>
                <Form.Label>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Form.Label>
                <Form.Control
                  as="select"
                  name={key}
                  value={profile[key]}
                  onChange={handleChange}
                  multiple
                >
                  {options[key] &&
                    options[key].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                </Form.Control>
              </Form.Group>
            </Col>
          ))}
        </Row>

        <Form.Group controlId="profession">
          <Form.Label>Profession</Form.Label>
          <Form.Control
            type="text"
            name="profession"
            value={profile.profession}
            onChange={handleChange}
            placeholder="Profession"
          />
        </Form.Group>

        <Form.Group controlId="education">
          <Form.Label>Education</Form.Label>
          <Form.Control
            type="text"
            name="education"
            value={profile.education}
            onChange={handleChange}
            placeholder="Education"
          />
        </Form.Group>

        <Row>
          {Object.keys(profile.privacySettings).map((key) => (
            <Col md={6} key={key}>
              <Form.Group controlId={key}>
                <Form.Label>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Form.Label>
                <Form.Control
                  as="select"
                  name={key}
                  value={profile.privacySettings[key]}
                  onChange={handlePrivacyChange}
                >
                  <option value="private">Private</option>
                  <option value="friends">Friends</option>
                  <option value="public">Public</option>
                </Form.Control>
              </Form.Group>
            </Col>
          ))}
        </Row>

        <Button variant="primary" type="submit" className="mt-3">
          Save Profile
        </Button>
      </Form>
    </Container>
  );
};

export default ProfileForm;
