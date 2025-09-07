import { Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import {
  Container,
  Card,
  ListGroup,
  Spinner,
  Alert,
} from 'react-bootstrap';
import api from './services/api';
import EvaluationSummary from './EvaluationSummary';  // <-- import the new component

/**
 * Profile component
 *
 * This component fetches the current user's profile from the backend and
 * displays a summary of all available profile information. The data is
 * grouped into logical sections such as basic info, appearance, lifestyle,
 * favourites, personality values and miscellaneous details. During
 * loading, a spinner is shown, and any errors encountered while
 * retrieving the profile are displayed as an alert.
 */
const Profile: React.FC = () => {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/userprofiles/profile/');
        setProfile(response.data);
      } catch (err) {
        setError('Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Helper to safely join arrays or split comma‑separated strings
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

  if (!profile) {
    return null;
  }

  // Destructure fields for readability. If a field isn't present, default to an
  // empty string or sensible default. Arrays are split into lists for display.
  const {
    full_name,
    bio,
    age_group,
    gender_identity,
    nationality,
    languages,
    location_city,
    location_state,
    location_country,
    zodiac_sign,
    eye_color,
    height,
    weight,
    body_type,
    hair_color,
    hair_style,
    skin_tone,
    tattoos_piercings,
    education_level,
    profession,
    diet,
    exercise_frequency,
    smoking,
    drinking,
    pets,
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
    fun_fact,
    goals,
    achievements,
    personal_quote,
    social_links,
    personality_values,
  } = profile;

  // Determine the user ID for evaluation summary; falls back to profile.id if user is nested.
  const userId: number | undefined =
    profile.user?.id ?? profile.id;

  return (
    <Container className="mt-5">
      <h2 className="mb-4">{full_name || 'Your Profile'}</h2>
      {bio && <p className="lead">{bio}</p>}

      {/* Basic Information */}
      <Card className="mb-3">
        <Card.Header>Basic Information</Card.Header>
        <ListGroup variant="flush">
          {age_group && (
            <ListGroup.Item>
              <strong>Age Group:</strong> {age_group}
            </ListGroup.Item>
          )}
          {gender_identity && (
            <ListGroup.Item>
              <strong>Gender:</strong> {gender_identity}
            </ListGroup.Item>
          )}
          {nationality && (
            <ListGroup.Item>
              <strong>Nationality:</strong> {nationality}
            </ListGroup.Item>
          )}
          {languages && toList(languages).length > 0 && (
            <ListGroup.Item>
              <strong>Languages:</strong> {toList(languages).join(', ')}
            </ListGroup.Item>
          )}
          {(location_city || location_state || location_country) && (
            <ListGroup.Item>
              <strong>Location:</strong>{' '}
              {[location_city, location_state, location_country]
                .filter(Boolean)
                .join(', ')}
            </ListGroup.Item>
          )}
          {zodiac_sign && (
            <ListGroup.Item>
              <strong>Zodiac Sign:</strong> {zodiac_sign}
            </ListGroup.Item>
          )}
        </ListGroup>
      </Card>

      {/* Appearance */}
      <Card className="mb-3">
        <Card.Header>Appearance</Card.Header>
        <ListGroup variant="flush">
          {eye_color && (
            <ListGroup.Item>
              <strong>Eye Colour:</strong> {eye_color}
            </ListGroup.Item>
          )}
          {height && (
            <ListGroup.Item>
              <strong>Height:</strong> {height}
            </ListGroup.Item>
          )}
          {weight && (
            <ListGroup.Item>
              <strong>Weight:</strong> {weight}
            </ListGroup.Item>
          )}
          {body_type && (
            <ListGroup.Item>
              <strong>Body Type:</strong> {body_type}
            </ListGroup.Item>
          )}
          {hair_color && (
            <ListGroup.Item>
              <strong>Hair Colour:</strong> {hair_color}
            </ListGroup.Item>
          )}
          {hair_style && (
            <ListGroup.Item>
              <strong>Hair Style:</strong> {hair_style}
            </ListGroup.Item>
          )}
          {skin_tone && (
            <ListGroup.Item>
              <strong>Skin Tone:</strong> {skin_tone}
            </ListGroup.Item>
          )}
          {tattoos_piercings && (
            <ListGroup.Item>
              <strong>Tattoos/Piercings:</strong> {tattoos_piercings}
            </ListGroup.Item>
          )}
        </ListGroup>
      </Card>

      {/* Lifestyle & Habits */}
      <Card className="mb-3">
        <Card.Header>Lifestyle & Habits</Card.Header>
        <ListGroup variant="flush">
          {diet && (
            <ListGroup.Item>
              <strong>Diet:</strong> {diet}
            </ListGroup.Item>
          )}
          {exercise_frequency && (
            <ListGroup.Item>
              <strong>Exercise Frequency:</strong> {exercise_frequency}
            </ListGroup.Item>
          )}
          {smoking && (
            <ListGroup.Item>
              <strong>Smoking:</strong> {smoking}
            </ListGroup.Item>
          )}
          {drinking && (
            <ListGroup.Item>
              <strong>Drinking:</strong> {drinking}
            </ListGroup.Item>
          )}
          {pets && (
            <ListGroup.Item>
              <strong>Pets:</strong> {pets}
            </ListGroup.Item>
          )}
        </ListGroup>
      </Card>

      {/* Favourites */}
      <Card className="mb-3">
        <Card.Header>Favourites</Card.Header>
        <ListGroup variant="flush">
          {hobbies && toList(hobbies).length > 0 && (
            <ListGroup.Item>
              <strong>Hobbies:</strong> {toList(hobbies).join(', ')}
            </ListGroup.Item>
          )}
          {favorite_songs && toList(favorite_songs).length > 0 && (
            <ListGroup.Item>
              <strong>Favourite Songs:</strong> {toList(favorite_songs).join(', ')}
            </ListGroup.Item>
          )}
          {favorite_artists && toList(favorite_artists).length > 0 && (
            <ListGroup.Item>
              <strong>Favourite Artists:</strong> {toList(favorite_artists).join(', ')}
            </ListGroup.Item>
          )}
          {favorite_books && toList(favorite_books).length > 0 && (
            <ListGroup.Item>
              <strong>Favourite Books:</strong> {toList(favorite_books).join(', ')}
            </ListGroup.Item>
          )}
          {favorite_movies && toList(favorite_movies).length > 0 && (
            <ListGroup.Item>
              <strong>Favourite Movies:</strong> {toList(favorite_movies).join(', ')}
            </ListGroup.Item>
          )}
          {favorite_tv_shows && toList(favorite_tv_shows).length > 0 && (
            <ListGroup.Item>
              <strong>Favourite TV Shows:</strong> {toList(favorite_tv_shows).join(', ')}
            </ListGroup.Item>
          )}
          {favorite_food && toList(favorite_food).length > 0 && (
            <ListGroup.Item>
              <strong>Favourite Food:</strong> {toList(favorite_food).join(', ')}
            </ListGroup.Item>
          )}
          {favorite_travel_destinations && toList(favorite_travel_destinations).length > 0 && (
            <ListGroup.Item>
              <strong>Favourite Travel Destinations:</strong> {toList(favorite_travel_destinations).join(', ')}
            </ListGroup.Item>
          )}
          {favorite_sport && (
            <ListGroup.Item>
              <strong>Favourite Sport:</strong> {favorite_sport}
            </ListGroup.Item>
          )}
          {favorite_podcasts && toList(favorite_podcasts).length > 0 && (
            <ListGroup.Item>
              <strong>Favourite Podcasts:</strong> {toList(favorite_podcasts).join(', ')}
            </ListGroup.Item>
          )}
          {favorite_influencers && toList(favorite_influencers).length > 0 && (
            <ListGroup.Item>
              <strong>Favourite Influencers:</strong> {toList(favorite_influencers).join(', ')}
            </ListGroup.Item>
          )}
        </ListGroup>
      </Card>

      {/* Fun & Miscellaneous */}
      <Card className="mb-3">
        <Card.Header>Fun & Miscellaneous</Card.Header>
        <ListGroup variant="flush">
          {fun_fact && (
            <ListGroup.Item>
              <strong>Fun Fact:</strong> {fun_fact}
            </ListGroup.Item>
          )}
          {goals && (
            <ListGroup.Item>
              <strong>Goals:</strong> {goals}
            </ListGroup.Item>
          )}
          {achievements && (
            <ListGroup.Item>
              <strong>Achievements:</strong> {achievements}
            </ListGroup.Item>
          )}
          {personal_quote && (
            <ListGroup.Item>
              <strong>Personal Quote:</strong> {personal_quote}
            </ListGroup.Item>
          )}
          {social_links && (
            <ListGroup.Item>
              <strong>Social Links:</strong> {social_links}
            </ListGroup.Item>
          )}
        </ListGroup>
      </Card>

      {/* Personality Values */}
      {personality_values && Object.keys(personality_values).length > 0 && (
        <Card className="mb-3">
          <Card.Header>Personality Values</Card.Header>
          <ListGroup variant="flush">
              {Object.entries(personality_values).map(([trait, value]) => (
                <ListGroup.Item key={trait}>
                  <>
                    <strong>{trait}:</strong> {value}
                  </>
                </ListGroup.Item>
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

      {/* Action: link to rate this user */}
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
