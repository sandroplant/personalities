import { Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
<<<<<<< HEAD
import {
  Container,
  Card,
  ListGroup,
  Spinner,
  Alert,
} from 'react-bootstrap';
import api from '../services/api';
import EvaluationSummary from './EvaluationSummary';  // <-- import the new component
=======
import { Container, Card, ListGroup, Spinner, Alert } from 'react-bootstrap';
import api from './services/api';
import EvaluationSummary from './EvaluationSummary';
>>>>>>> fddbe62 (Privacy + profile requests backend scaffolding; viewer-aware privacy; CI; frontend stubs)

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        try {
          // Prefer privacy-filtered endpoint if available
          const response = await api.get('/userprofiles/privacy/visible-profile/');
          setProfile(response.data);
          return;
        } catch (err: any) {
          // fall through to standard endpoints
        }

        try {
          // Fallback 1: userprofiles/profile (if project exposes it)
          const resp2 = await api.get('/userprofiles/profile/');
          setProfile(resp2.data);
          return;
        } catch (err2: any) {
          // fall through
        }

        // Fallback 2: legacy root /profile/ used by your project
        const resp3 = await api.get('/profile/');
        setProfile(resp3.data);
      } catch (err) {
        setError('Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Normalize arrays/CSV strings
  const toList = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return String(value).split(',').map((item) => item.trim()).filter(Boolean);
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!profile) return null;

  const {
    full_name,
    bio,
    // Basic
    age_group,
    gender_identity,
    nationality,
    languages,
    location_city,
    location_state,
    location_country,
    zodiac_sign,
    // Appearance
    eye_color,
    height,
    weight,
    body_type,
    hair_color,
    hair_style,
    skin_tone,
    tattoos_piercings,
    // Lifestyle
    diet,
    exercise_frequency,
    smoking,
    drinking,
    pets,
    // Favourites
    hobbies,
    favorite_songs,
    favorite_artists,
    favorite_books,
    favorite_movies,
    favorite_tv_shows,
    favorite_food,
    favorite_travel_destinations,
    favorite_sport,
    favorite_podcasts,
    favorite_influencers,
    // Fun & Misc
    fun_fact,
    goals,
    achievements,
    personal_quote,
    social_links,
    // Personality
    personality_values,
  } = profile;

  const userId: number | undefined = profile.user?.id ?? profile.id;

  // Compose location string once
  const locationJoined = [location_city, location_state, location_country]
    .filter(Boolean)
    .join(', ');

  return (
    <Container className="mt-5">
      <h2 className="mb-4">{full_name || 'Your Profile'}</h2>
      {bio && <p className="lead">{bio}</p>}

      {/* Basic Information */}
      <Card className="mb-3">
        <Card.Header>Basic Information</Card.Header>
        <ListGroup variant="flush">
          {age_group && (
            <ListGroup.Item children={<span><strong>Age Group:</strong> {age_group}</span>} />
          )}
          {gender_identity && (
            <ListGroup.Item children={<span><strong>Gender:</strong> {gender_identity}</span>} />
          )}
          {nationality && (
            <ListGroup.Item children={<span><strong>Nationality:</strong> {nationality}</span>} />
          )}
          {languages && toList(languages).length > 0 && (
            <ListGroup.Item
              children={<span><strong>Languages:</strong> {toList(languages).join(', ')}</span>}
            />
          )}
          {(location_city || location_state || location_country) && (
            <ListGroup.Item
              children={
                <span>
                  <strong>Location:</strong> {locationJoined}
                </span>
              }
            />
          )}
          {zodiac_sign && (
            <ListGroup.Item children={<span><strong>Zodiac Sign:</strong> {zodiac_sign}</span>} />
          )}
        </ListGroup>
      </Card>

      {/* Appearance */}
      <Card className="mb-3">
        <Card.Header>Appearance</Card.Header>
        <ListGroup variant="flush">
          {eye_color && (
            <ListGroup.Item children={<span><strong>Eye Colour:</strong> {eye_color}</span>} />
          )}
          {height && (
            <ListGroup.Item children={<span><strong>Height:</strong> {height}</span>} />
          )}
          {weight && (
            <ListGroup.Item children={<span><strong>Weight:</strong> {weight}</span>} />
          )}
          {body_type && (
            <ListGroup.Item children={<span><strong>Body Type:</strong> {body_type}</span>} />
          )}
          {hair_color && (
            <ListGroup.Item children={<span><strong>Hair Colour:</strong> {hair_color}</span>} />
          )}
          {hair_style && (
            <ListGroup.Item children={<span><strong>Hair Style:</strong> {hair_style}</span>} />
          )}
          {skin_tone && (
            <ListGroup.Item children={<span><strong>Skin Tone:</strong> {skin_tone}</span>} />
          )}
          {tattoos_piercings && (
            <ListGroup.Item children={<span><strong>Tattoos/Piercings:</strong> {tattoos_piercings}</span>} />
          )}
        </ListGroup>
      </Card>

      {/* Lifestyle & Habits */}
      <Card className="mb-3">
        <Card.Header>Lifestyle & Habits</Card.Header>
        <ListGroup variant="flush">
          {diet && (
            <ListGroup.Item children={<span><strong>Diet:</strong> {diet}</span>} />
          )}
          {exercise_frequency && (
            <ListGroup.Item children={<span><strong>Exercise Frequency:</strong> {exercise_frequency}</span>} />
          )}
          {smoking && (
            <ListGroup.Item children={<span><strong>Smoking:</strong> {smoking}</span>} />
          )}
          {drinking && (
            <ListGroup.Item children={<span><strong>Drinking:</strong> {drinking}</span>} />
          )}
          {pets && (
            <ListGroup.Item children={<span><strong>Pets:</strong> {pets}</span>} />
          )}
        </ListGroup>
      </Card>

      {/* Favourites */}
      <Card className="mb-3">
        <Card.Header>Favourites</Card.Header>
        <ListGroup variant="flush">
          {hobbies && toList(hobbies).length > 0 && (
            <ListGroup.Item children={<span><strong>Hobbies:</strong> {toList(hobbies).join(', ')}</span>} />
          )}
          {favorite_songs && toList(favorite_songs).length > 0 && (
            <ListGroup.Item children={<span><strong>Favourite Songs:</strong> {toList(favorite_songs).join(', ')}</span>} />
          )}
          {favorite_artists && toList(favorite_artists).length > 0 && (
            <ListGroup.Item children={<span><strong>Favourite Artists:</strong> {toList(favorite_artists).join(', ')}</span>} />
          )}
          {favorite_books && toList(favorite_books).length > 0 && (
            <ListGroup.Item children={<span><strong>Favourite Books:</strong> {toList(favorite_books).join(', ')}</span>} />
          )}
          {favorite_movies && toList(favorite_movies).length > 0 && (
            <ListGroup.Item children={<span><strong>Favourite Movies:</strong> {toList(favorite_movies).join(', ')}</span>} />
          )}
          {favorite_tv_shows && toList(favorite_tv_shows).length > 0 && (
            <ListGroup.Item children={<span><strong>Favourite TV Shows:</strong> {toList(favorite_tv_shows).join(', ')}</span>} />
          )}
          {favorite_food && toList(favorite_food).length > 0 && (
            <ListGroup.Item children={<span><strong>Favourite Food:</strong> {toList(favorite_food).join(', ')}</span>} />
          )}
          {favorite_travel_destinations && toList(favorite_travel_destinations).length > 0 && (
            <ListGroup.Item children={<span><strong>Favourite Travel Destinations:</strong> {toList(favorite_travel_destinations).join(', ')}</span>} />
          )}
          {favorite_sport && (
            <ListGroup.Item children={<span><strong>Favourite Sport:</strong> {favorite_sport}</span>} />
          )}
          {favorite_podcasts && toList(favorite_podcasts).length > 0 && (
            <ListGroup.Item children={<span><strong>Favourite Podcasts:</strong> {toList(favorite_podcasts).join(', ')}</span>} />
          )}
          {favorite_influencers && toList(favorite_influencers).length > 0 && (
            <ListGroup.Item children={<span><strong>Favourite Influencers:</strong> {toList(favorite_influencers).join(', ')}</span>} />
          )}
        </ListGroup>
      </Card>

      {/* Fun & Miscellaneous */}
      <Card className="mb-3">
        <Card.Header>Fun & Miscellaneous</Card.Header>
        <ListGroup variant="flush">
          {fun_fact && (
            <ListGroup.Item children={<span><strong>Fun Fact:</strong> {fun_fact}</span>} />
          )}
          {goals && (
            <ListGroup.Item children={<span><strong>Goals:</strong> {goals}</span>} />
          )}
          {achievements && (
            <ListGroup.Item children={<span><strong>Achievements:</strong> {achievements}</span>} />
          )}
          {personal_quote && (
            <ListGroup.Item children={<span><strong>Personal Quote:</strong> {personal_quote}</span>} />
          )}
          {social_links && (
            <ListGroup.Item children={<span><strong>Social Links:</strong> {social_links}</span>} />
          )}
        </ListGroup>
      </Card>

      {/* Personality Values */}
      {personality_values && Object.keys(personality_values).length > 0 && (
        <Card className="mb-3">
          <Card.Header>Personality Values</Card.Header>
          <ListGroup variant="flush">
            {Object.entries(personality_values).map(([trait, value]) => (
<<<<<<< HEAD
              <ListGroup.Item key={trait}>
                <strong>{`${trait}: ${value}`}</strong>
              </ListGroup.Item>
=======
              <ListGroup.Item
                key={trait}
                children={<span><strong>{trait}:</strong> {String(value)}</span>}
              />
>>>>>>> fddbe62 (Privacy + profile requests backend scaffolding; viewer-aware privacy; CI; frontend stubs)
            ))}
          </ListGroup>
        </Card>
      )}

      {/* Ratings Summary */}
      {userId && (
        <Card className="mb-3">
          <Card.Header>Your Ratings Summary</Card.Header>
          <Card.Body>
            <EvaluationSummary userId={userId} />
          </Card.Body>
        </Card>
      )}

      {/* Rate this user */}
      {profile.user && (
        <div className="mt-3 text-center">
          <Link to={`/evaluate/${profile.user.id}`} className="btn btn-primary">
            Rate this user
          </Link>
        </div>
      )}
    </Container>
  );
};

export default Profile;
