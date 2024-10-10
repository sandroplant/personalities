import React, { useState } from 'react';
import { Container, Form, Row, Col, Button } from 'react-bootstrap';

interface ProfileData {
  humor: string;
  adventurousness: string;
  height: string;
  weight: string;
  hairColor: string;
  eyeColor: string;
  skinColor: string;
  music: string;
  movies: string;
  books: string;
  hobbies: string;
  interests: string;
  profession: string;
  education: string;
  privacy: string;
}

const Profile: React.FC = () => {
  const [profileData, setProfileData] = useState<ProfileData>({
    humor: '',
    adventurousness: '',
    height: '',
    weight: '',
    hairColor: '',
    eyeColor: '',
    skinColor: '',
    music: '',
    movies: '',
    books: '',
    hobbies: '',
    interests: '',
    profession: '',
    education: '',
    privacy: 'friends', // Default privacy setting
  });

  const criteriaOptions = [
    'Humor',
    'Adventurousness',
    'Wisdom',
    'Open-mindedness',
    'Responsibility',
  ];

  const dropdownOptions = {
    height: ['Short', 'Average', 'Tall'],
    weight: ['Underweight', 'Normal', 'Overweight'],
    hairColor: ['Blonde', 'Brunette', 'Red', 'Black', 'Gray'],
    eyeColor: ['Blue', 'Green', 'Brown', 'Gray', 'Hazel'],
    skinColor: ['Pale', 'Light', 'Medium', 'Dark'],
    hobbies: ['Reading', 'Sports', 'Traveling', 'Music', 'Cooking'],
    interests: ['Technology', 'Art', 'Science', 'History', 'Music'],
    profession: ['Engineer', 'Doctor', 'Artist', 'Teacher', 'Entrepreneur'],
    education: [
      'High School',
      'Associate Degree',
      'Bachelor’s Degree',
      'Master’s Degree',
      'PhD',
    ],
  };

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setProfileData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Profile data saved:', profileData);
    // Add form submission logic here
  };

  return (
    <Container className="mt-5">
      <h1>User Profile</h1>
      <Form onSubmit={handleSubmit}>
        <Row>
          {criteriaOptions.map((option) => (
            <Col md={6} key={option}>
              <Form.Group controlId={option.toLowerCase()}>
                <Form.Label>{option}</Form.Label>
                <Form.Control
                  type="number"
                  name={option.toLowerCase()}
                  min="1"
                  max="10"
                  value={profileData[option.toLowerCase() as keyof ProfileData]}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          ))}
        </Row>

        <Row>
          {Object.keys(dropdownOptions).map((key) => (
            <Col md={6} key={key}>
              <Form.Group controlId={key}>
                <Form.Label>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Form.Label>
                <Form.Control
                  as="select"
                  name={key}
                  value={profileData[key as keyof ProfileData]}
                  onChange={handleChange}
                >
                  <option value="">Select...</option>
                  {dropdownOptions[key as keyof typeof dropdownOptions].map(
                    (option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    )
                  )}
                </Form.Control>
              </Form.Group>
            </Col>
          ))}
        </Row>

        <Form.Group controlId="music">
          <Form.Label>Music</Form.Label>
          <Form.Control
            type="text"
            name="music"
            value={profileData.music}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group controlId="movies">
          <Form.Label>Movies</Form.Label>
          <Form.Control
            type="text"
            name="movies"
            value={profileData.movies}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group controlId="books">
          <Form.Label>Books</Form.Label>
          <Form.Control
            type="text"
            name="books"
            value={profileData.books}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group controlId="hobbies">
          <Form.Label>Hobbies</Form.Label>
          <Form.Control
            type="text"
            name="hobbies"
            value={profileData.hobbies}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group controlId="interests">
          <Form.Label>Interests</Form.Label>
          <Form.Control
            type="text"
            name="interests"
            value={profileData.interests}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group controlId="profession">
          <Form.Label>Profession</Form.Label>
          <Form.Control
            type="text"
            name="profession"
            value={profileData.profession}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group controlId="education">
          <Form.Label>Education</Form.Label>
          <Form.Control
            type="text"
            name="education"
            value={profileData.education}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group controlId="privacy">
          <Form.Label>Privacy</Form.Label>
          <Form.Control
            as="select"
            name="privacy"
            value={profileData.privacy}
            onChange={handleChange}
          >
            <option value="friends">Friends</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </Form.Control>
        </Form.Group>

        <Button variant="primary" type="submit" className="mt-3">
          Save Profile
        </Button>
      </Form>
    </Container>
  );
};

export default Profile;
