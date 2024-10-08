import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Container, Form, Row, Col, Button } from 'react-bootstrap';
import options from '../../src/config/options'; // Ensure this path is correct or create the module if it doesn't exist

interface Criteria {
  humor: string;
  adventurousness: string;
  [key: string]: string;
}

interface Appearance {
  eyeColor: string;
  height: string;
  weight: string;
  bodyType: string;
  hairColor: string;
  skinColor: string;
  [key: string]: string;
}

interface PrivacySettings {
  spotifyInfo: string;
  favoriteMovies: string;
  favoriteBooks: string;
  appearance: string;
  hobbies: string;
  interests: string;
  profession: string;
  education: string;
  [key: string]: string;
}

interface ProfileData {
  fullName: string;
  bio: string;
  criteria: Criteria;
  spotifyInfo: {
    topArtists: string[];
    topSongs: string[];
    currentPlayback: string;
  };
  favoriteMovies: string[];
  favoriteBooks: string[];
  appearance: Appearance;
  hobbies: string[];
  interests: string[];
  profession: string;
  education: string;
  privacySettings: PrivacySettings;
}

const ProfileForm: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData>({
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

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  const handleCriteriaChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      criteria: {
        ...prevProfile.criteria,
        [name]: value,
      },
    }));
  };

  const handleAppearanceChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      appearance: {
        ...prevProfile.appearance,
        [name]: value,
      },
    }));
  };

  const handlePrivacyChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      privacySettings: {
        ...prevProfile.privacySettings,
        [name]: value,
      },
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
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
                    options[key].map((option: string) => (
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
                  value={profile[key as keyof ProfileData] as string}
                  onChange={handleChange}
                  multiple
                >
                  {options[key] &&
                    options[key].map((option: string) => (
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
            as="select"
            name="profession"
            value={profile.profession}
            onChange={handleChange}
          >
            <option value="">Select...</option>
            {options.professions.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Form.Control>
        </Form.Group>

        <Form.Group controlId="education">
          <Form.Label>Education</Form.Label>
          <Form.Control
            as="select"
            name="education"
            value={profile.education}
            onChange={handleChange}
          >
            <option value="">Select...</option>
            {options.educationLevels.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Form.Control>
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
