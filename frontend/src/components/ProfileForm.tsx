// frontend/src/components/ProfileForm.tsx

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Container, Form, Row, Col, Button } from 'react-bootstrap';
import options from '../config/options'; // Ensure this path is correct

// Define interfaces for different sections of the profile
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
  // Initialize the profile state with default values
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

  /**
   * Handle changes for single and multiple select inputs.
   * For multiple selects, it captures all selected options as an array.
   */
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const {
      name,
      value,
      type,
      options: selectOptions,
    } = e.target as HTMLSelectElement;
    const multiple = (e.target as HTMLSelectElement).multiple;

    let newValue: string | string[] = value;

    if (type === 'select-multiple' && multiple) {
      const selectedValues: string[] = [];
      for (let i = 0; i < selectOptions.length; i++) {
        if (selectOptions[i].selected) {
          selectedValues.push(selectOptions[i].value);
        }
      }
      newValue = selectedValues;
    }

    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: newValue,
    }));
  };

  /**
   * Handle changes for the 'criteria' section.
   */
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

  /**
   * Handle changes for the 'appearance' section.
   */
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

  /**
   * Handle changes for the 'privacySettings' section.
   */
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

  /**
   * Handle form submission.
   * Currently, it logs the profile data to the console.
   * You can modify this to send data to a backend or perform other actions.
   */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('Profile data saved:', profile);
    // TODO: Implement actual save functionality (e.g., API call)
  };

  return (
    <Container className="mt-5">
      <h1>Edit Profile</h1>
      <Form onSubmit={handleSubmit}>
        {/* Full Name Field */}
        <Form.Group controlId="fullName">
          <Form.Label>Full Name</Form.Label>
          <Form.Control
            type="text"
            name="fullName"
            value={profile.fullName}
            onChange={handleChange}
            placeholder="Full Name"
            required
          />
        </Form.Group>

        {/* Bio Field */}
        <Form.Group controlId="bio">
          <Form.Label>Bio</Form.Label>
          <Form.Control
            as="textarea"
            name="bio"
            value={profile.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself"
            rows={3}
          />
        </Form.Group>

        {/* Criteria Section */}
        <h3>Criteria</h3>
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
                  placeholder={`Rate your ${key}`}
                />
              </Form.Group>
            </Col>
          ))}
        </Row>

        {/* Appearance Section */}
        <h3>Appearance</h3>
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
                    (options[key] as string[]).map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                </Form.Control>
              </Form.Group>
            </Col>
          ))}
        </Row>

        {/* Hobbies and Interests Section */}
        <h3>Hobbies & Interests</h3>
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
                  value={profile[key as keyof ProfileData] as string[]}
                  onChange={handleChange}
                  multiple
                >
                  {options[key] &&
                    (options[key] as string[]).map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                </Form.Control>
              </Form.Group>
            </Col>
          ))}
        </Row>

        {/* Profession Field */}
        <Form.Group controlId="profession">
          <Form.Label>Profession</Form.Label>
          <Form.Control
            as="select"
            name="profession"
            value={profile.profession}
            onChange={handleChange}
          >
            <option value="">Select...</option>
            {options.professions &&
              options.professions.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
          </Form.Control>
        </Form.Group>

        {/* Education Field */}
        <Form.Group controlId="education">
          <Form.Label>Education</Form.Label>
          <Form.Control
            as="select"
            name="education"
            value={profile.education}
            onChange={handleChange}
          >
            <option value="">Select...</option>
            {options.educationLevels &&
              options.educationLevels.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
          </Form.Control>
        </Form.Group>

        {/* Privacy Settings Section */}
        <h3>Privacy Settings</h3>
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

        {/* Submit Button */}
        <Button variant="primary" type="submit" className="mt-3">
          Save Profile
        </Button>
      </Form>
    </Container>
  );
};

export default ProfileForm;
