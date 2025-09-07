// frontend/src/components/ProfileForm.tsx

import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { Container, Form, Row, Col, Button } from 'react-bootstrap';
import options from '../config/options'; // Ensure this path is correct

// Import the shared API service to communicate with the backend
import api from '../services/api';

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
  /**
   * Additional physical attributes
   */
  hairStyle: string;
  tattoosPiercings: string;
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
  /**
   * Favorite movies and books stored as comma-separated strings.
   */
  favoriteMovies: string;
  favoriteBooks: string;
  appearance: Appearance;
  hobbies: string[];
  interests: string[];
  profession: string;
  education: string;
  privacySettings: PrivacySettings;

  /**
   * Extended basic information fields
   */
  profilePicture: string;
  ageGroup: string;
  genderIdentity: string;
  pronouns: string;
  nationality: string;
  languages: string[];
  locationCity: string;
  locationState: string;
  locationCountry: string;
  zodiacSign: string;

  /**
   * Lifestyle & habits
   */
  diet: string;
  exerciseFrequency: string;
  smoking: string;
  drinking: string;
  pets: string;

  /**
   * Favorites
   */
  favoriteSongs: string;
  favoriteArtists: string;
  favoriteTvShows: string;
  favoriteFood: string;
  favoriteTravelDestinations: string;
  favoriteSport: string;
  favoritePodcasts: string;
  favoriteInfluencers: string;

  /**
   * Fun & miscellaneous
   */
  funFact: string;
  goals: string;
  achievements: string;
  personalQuote: string;
  socialLinks: string;

  /**
   * Personality values: an array of objects capturing value name, self rating (1-10) and whether friends can rate
   */
  personalityValues: {
    valueName: string;
    selfRating: number;
    friends: boolean;
  }[];
}

const ProfileForm: React.FC = () => {
  // Initialize the profile state with default values
  const [profile, setProfile] = useState<ProfileData>({
    fullName: '',
    bio: '',
    criteria: { humor: '', adventurousness: '' },
    spotifyInfo: { topArtists: [], topSongs: [], currentPlayback: '' },
    favoriteMovies: '',
    favoriteBooks: '',
    appearance: {
      eyeColor: '',
      height: '',
      weight: '',
      bodyType: '',
      hairColor: '',
      skinColor: '',
      hairStyle: '',
      tattoosPiercings: '',
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
    profilePicture: '',
    ageGroup: '',
    genderIdentity: '',
    pronouns: '',
    nationality: '',
    languages: [],
    locationCity: '',
    locationState: '',
    locationCountry: '',
    zodiacSign: '',
    diet: '',
    exerciseFrequency: '',
    smoking: '',
    drinking: '',
    pets: '',
    favoriteSongs: '',
    favoriteArtists: '',
    favoriteTvShows: '',
    favoriteFood: '',
    favoriteTravelDestinations: '',
    favoriteSport: '',
    favoritePodcasts: '',
    favoriteInfluencers: '',
    funFact: '',
    goals: '',
    achievements: '',
    personalQuote: '',
    socialLinks: '',
    personalityValues: [],
  });

  /**
   * Fetch the current user's profile from the backend on component mount.
   * The API returns flat field names (e.g. eye_color) which are mapped back
   * into the nested state structure here. If a field isn't present, a
   * sensible default is used.
   */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/userprofiles/profile/');
        const data = response.data;
        setProfile((prev) => ({
          ...prev,
          fullName: data.full_name || prev.fullName,
          bio: data.bio || prev.bio,
          profilePicture: data.profile_picture || prev.profilePicture,
          ageGroup: data.age_group || prev.ageGroup,
          genderIdentity: data.gender_identity || prev.genderIdentity,
          pronouns: data.pronouns || prev.pronouns,
          nationality: data.nationality || prev.nationality,
          languages: data.languages
            ? data.languages.split(',')
            : prev.languages,
          locationCity: data.location_city || prev.locationCity,
          locationState: data.location_state || prev.locationState,
          locationCountry: data.location_country || prev.locationCountry,
          zodiacSign: data.zodiac_sign || prev.zodiacSign,
          diet: data.diet || prev.diet,
          exerciseFrequency: data.exercise_frequency || prev.exerciseFrequency,
          smoking: data.smoking || prev.smoking,
          drinking: data.drinking || prev.drinking,
          pets: data.pets || prev.pets,
          hobbies: data.hobbies
            ? Array.isArray(data.hobbies)
              ? data.hobbies
              : String(data.hobbies).split(',')
            : prev.hobbies,
          favoriteSongs: data.favorite_songs || prev.favoriteSongs,
          favoriteArtists: data.favorite_artists || prev.favoriteArtists,
          favoriteBooks: data.favorite_books || prev.favoriteBooks,
          favoriteMovies: data.favorite_movies || prev.favoriteMovies,
          favoriteTvShows: data.favorite_tv_shows || prev.favoriteTvShows,
          favoriteFood: data.favorite_food || prev.favoriteFood,
          favoriteTravelDestinations:
            data.favorite_travel_destinations ||
            prev.favoriteTravelDestinations,
          favoriteSport: data.favorite_sport || prev.favoriteSport,
          favoritePodcasts: data.favorite_podcasts || prev.favoritePodcasts,
          favoriteInfluencers:
            data.favorite_influencers || prev.favoriteInfluencers,
          funFact: data.fun_fact || prev.funFact,
          goals: data.goals || prev.goals,
          achievements: data.achievements || prev.achievements,
          personalQuote: data.personal_quote || prev.personalQuote,
          socialLinks: data.social_links || prev.socialLinks,
          personalityValues: data.personality_values || prev.personalityValues,
          appearance: {
            ...prev.appearance,
            eyeColor: data.eye_color || prev.appearance.eyeColor,
            height: data.height || prev.appearance.height,
            weight: data.weight || prev.appearance.weight,
            bodyType: data.body_type || prev.appearance.bodyType,
            hairColor: data.hair_color || prev.appearance.hairColor,
            skinColor: data.skin_tone || prev.appearance.skinColor,
            hairStyle: data.hair_style || prev.appearance.hairStyle,
            tattoosPiercings:
              data.tattoos_piercings || prev.appearance.tattoosPiercings,
          },
        }));
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, []);

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
   * Add a new entry to the personality values list
   */
  const addPersonalityValue = () => {
    setProfile((prev) => ({
      ...prev,
      personalityValues: [
        ...prev.personalityValues,
        { valueName: '', selfRating: 1, friends: false },
      ],
    }));
  };

  /**
   * Update a specific field of a personality value
   */
  const handlePersonalityValueChange = (
    index: number,
    field: string,
    value: any
  ) => {
    setProfile((prev) => {
      const updated = prev.personalityValues.map((pv, i) =>
        i === index ? { ...pv, [field]: value } : pv
      );
      return { ...prev, personalityValues: updated };
    });
  };

  /**
   * Remove a personality value entry
   */
  const removePersonalityValue = (index: number) => {
    setProfile((prev) => {
      const updated = prev.personalityValues.filter((_, i) => i !== index);
      return { ...prev, personalityValues: updated };
    });
  };

  /**
   * Handle form submission.
   * Currently, it logs the profile data to the console.
   * You can modify this to send data to a backend or perform other actions.
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Build a payload matching the backend fields. Arrays are joined into
    // comma-separated strings and nested objects are flattened.
    const payload: { [key: string]: any } = {
      bio: profile.bio,
      profile_picture: profile.profilePicture,
      age_group: profile.ageGroup,
      gender_identity: profile.genderIdentity,
      pronouns: profile.pronouns,
      nationality: profile.nationality,
      languages: profile.languages.join(','),
      location_city: profile.locationCity,
      location_state: profile.locationState,
      location_country: profile.locationCountry,
      zodiac_sign: profile.zodiacSign,
      eye_color: profile.appearance.eyeColor,
      height: profile.appearance.height,
      weight: profile.appearance.weight,
      body_type: profile.appearance.bodyType,
      hair_color: profile.appearance.hairColor,
      hair_style: profile.appearance.hairStyle,
      skin_tone: profile.appearance.skinColor,
      tattoos_piercings: profile.appearance.tattoosPiercings,
      education_level: profile.education,
      profession: profile.profession,
      diet: profile.diet,
      exercise_frequency: profile.exerciseFrequency,
      smoking: profile.smoking,
      drinking: profile.drinking,
      pets: profile.pets,
      hobbies: profile.hobbies.join(','),
      favorite_songs: profile.favoriteSongs,
      favorite_artists: profile.favoriteArtists,
      favorite_books: profile.favoriteBooks,
      favorite_movies: profile.favoriteMovies,
      favorite_tv_shows: profile.favoriteTvShows,
      favorite_food: profile.favoriteFood,
      favorite_travel_destinations: profile.favoriteTravelDestinations,
      favorite_sport: profile.favoriteSport,
      favorite_podcasts: profile.favoritePodcasts,
      favorite_influencers: profile.favoriteInfluencers,
      fun_fact: profile.funFact,
      goals: profile.goals,
      achievements: profile.achievements,
      personal_quote: profile.personalQuote,
      social_links: profile.socialLinks,
      personality_values: profile.personalityValues,
    };
    try {
      await api.post('/userprofiles/profile/update/', payload);
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
    }
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

        {/* Basic Information Section */}
        <h3>Basic Information</h3>
        <Form.Group controlId="profilePicture">
          <Form.Label>Profile Picture URL</Form.Label>
          <Form.Control
            type="url"
            name="profilePicture"
            value={profile.profilePicture}
            onChange={handleChange}
            placeholder="Image URL"
          />
        </Form.Group>
        <Row>
          <Col md={4}>
            <Form.Group controlId="ageGroup">
              <Form.Label>Age Group</Form.Label>
              <Form.Control
                as="select"
                name="ageGroup"
                value={profile.ageGroup}
                onChange={handleChange}
              >
                <option value="">Select...</option>
                {options.ageGroup &&
                  options.ageGroup.map((option: string) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
              </Form.Control>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="genderIdentity">
              <Form.Label>Gender Identity</Form.Label>
              <Form.Control
                as="select"
                name="genderIdentity"
                value={profile.genderIdentity}
                onChange={handleChange}
              >
                <option value="">Select...</option>
                {options.genderIdentity &&
                  options.genderIdentity.map((option: string) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
              </Form.Control>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="pronouns">
              <Form.Label>Pronouns</Form.Label>
              <Form.Control
                as="select"
                name="pronouns"
                value={profile.pronouns}
                onChange={handleChange}
              >
                <option value="">Select...</option>
                {options.pronouns &&
                  options.pronouns.map((option: string) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
              </Form.Control>
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={4}>
            <Form.Group controlId="nationality">
              <Form.Label>Nationality</Form.Label>
              <Form.Control
                type="text"
                name="nationality"
                value={profile.nationality}
                onChange={handleChange}
                placeholder="Nationality"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="languages">
              <Form.Label>Languages</Form.Label>
              <Form.Control
                as="select"
                name="languages"
                value={profile.languages as unknown as string[]}
                onChange={handleChange}
                multiple
              >
                {options.languages &&
                  options.languages.map((option: string) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
              </Form.Control>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="zodiacSign">
              <Form.Label>Zodiac Sign</Form.Label>
              <Form.Control
                as="select"
                name="zodiacSign"
                value={profile.zodiacSign}
                onChange={handleChange}
              >
                <option value="">Select...</option>
                {options.zodiacSign &&
                  options.zodiacSign.map((option: string) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
              </Form.Control>
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={4}>
            <Form.Group controlId="locationCity">
              <Form.Label>City</Form.Label>
              <Form.Control
                type="text"
                name="locationCity"
                value={profile.locationCity}
                onChange={handleChange}
                placeholder="City"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="locationState">
              <Form.Label>State</Form.Label>
              <Form.Control
                type="text"
                name="locationState"
                value={profile.locationState}
                onChange={handleChange}
                placeholder="State"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="locationCountry">
              <Form.Label>Country</Form.Label>
              <Form.Control
                type="text"
                name="locationCountry"
                value={profile.locationCountry}
                onChange={handleChange}
                placeholder="Country"
              />
            </Form.Group>
          </Col>
        </Row>

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

        {/* Lifestyle & Habits Section */}
        <h3>Lifestyle & Habits</h3>
        <Row>
          <Col md={4}>
            <Form.Group controlId="diet">
              <Form.Label>Diet</Form.Label>
              <Form.Control
                as="select"
                name="diet"
                value={profile.diet}
                onChange={handleChange}
              >
                <option value="">Select...</option>
                {options.diet &&
                  options.diet.map((option: string) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
              </Form.Control>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="exerciseFrequency">
              <Form.Label>Exercise Frequency</Form.Label>
              <Form.Control
                as="select"
                name="exerciseFrequency"
                value={profile.exerciseFrequency}
                onChange={handleChange}
              >
                <option value="">Select...</option>
                {options.exerciseFrequency &&
                  options.exerciseFrequency.map((option: string) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
              </Form.Control>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="smoking">
              <Form.Label>Smoking</Form.Label>
              <Form.Control
                as="select"
                name="smoking"
                value={profile.smoking}
                onChange={handleChange}
              >
                <option value="">Select...</option>
                {options.smoking &&
                  options.smoking.map((option: string) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
              </Form.Control>
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={4}>
            <Form.Group controlId="drinking">
              <Form.Label>Drinking</Form.Label>
              <Form.Control
                as="select"
                name="drinking"
                value={profile.drinking}
                onChange={handleChange}
              >
                <option value="">Select...</option>
                {options.drinking &&
                  options.drinking.map((option: string) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
              </Form.Control>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="pets">
              <Form.Label>Pets</Form.Label>
              <Form.Control
                as="select"
                name="pets"
                value={profile.pets}
                onChange={handleChange}
              >
                <option value="">Select...</option>
                {options.pets &&
                  options.pets.map((option: string) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
              </Form.Control>
            </Form.Group>
          </Col>
        </Row>

        {/* Favorites Section */}
        <h3>Favorites</h3>
        <Form.Group controlId="favoriteSongs">
          <Form.Label>Favorite Songs</Form.Label>
          <Form.Control
            type="text"
            name="favoriteSongs"
            value={profile.favoriteSongs}
            onChange={handleChange}
            placeholder="List your favorite songs (comma separated)"
          />
        </Form.Group>
        <Form.Group controlId="favoriteArtists">
          <Form.Label>Favorite Artists</Form.Label>
          <Form.Control
            type="text"
            name="favoriteArtists"
            value={profile.favoriteArtists}
            onChange={handleChange}
            placeholder="List your favorite artists (comma separated)"
          />
        </Form.Group>
        <Form.Group controlId="favoriteMovies">
          <Form.Label>Favorite Movies</Form.Label>
          <Form.Control
            type="text"
            name="favoriteMovies"
            value={profile.favoriteMovies}
            onChange={handleChange}
            placeholder="List your favorite movies (comma separated)"
          />
        </Form.Group>
        <Form.Group controlId="favoriteBooks">
          <Form.Label>Favorite Books</Form.Label>
          <Form.Control
            type="text"
            name="favoriteBooks"
            value={profile.favoriteBooks}
            onChange={handleChange}
            placeholder="List your favorite books (comma separated)"
          />
        </Form.Group>
        <Form.Group controlId="favoriteTvShows">
          <Form.Label>Favorite TV Shows</Form.Label>
          <Form.Control
            type="text"
            name="favoriteTvShows"
            value={profile.favoriteTvShows}
            onChange={handleChange}
            placeholder="List your favorite TV shows (comma separated)"
          />
        </Form.Group>
        <Form.Group controlId="favoriteFood">
          <Form.Label>Favorite Food</Form.Label>
          <Form.Control
            type="text"
            name="favoriteFood"
            value={profile.favoriteFood}
            onChange={handleChange}
            placeholder="Favorite food"
          />
        </Form.Group>
        <Form.Group controlId="favoriteTravelDestinations">
          <Form.Label>Favorite Travel Destinations</Form.Label>
          <Form.Control
            type="text"
            name="favoriteTravelDestinations"
            value={profile.favoriteTravelDestinations}
            onChange={handleChange}
            placeholder="List your favorite travel destinations (comma separated)"
          />
        </Form.Group>
        <Form.Group controlId="favoriteSport">
          <Form.Label>Favorite Sport</Form.Label>
          <Form.Control
            as="select"
            name="favoriteSport"
            value={profile.favoriteSport}
            onChange={handleChange}
          >
            <option value="">Select...</option>
            {options.favoriteSport &&
              options.favoriteSport.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
          </Form.Control>
        </Form.Group>
        <Form.Group controlId="favoritePodcasts">
          <Form.Label>Favorite Podcasts</Form.Label>
          <Form.Control
            type="text"
            name="favoritePodcasts"
            value={profile.favoritePodcasts}
            onChange={handleChange}
            placeholder="List your favorite podcasts (comma separated)"
          />
        </Form.Group>
        <Form.Group controlId="favoriteInfluencers">
          <Form.Label>Favorite Influencers</Form.Label>
          <Form.Control
            type="text"
            name="favoriteInfluencers"
            value={profile.favoriteInfluencers}
            onChange={handleChange}
            placeholder="List your favorite influencers (comma separated)"
          />
        </Form.Group>

        {/* Fun & Miscellaneous Section */}
        <h3>Fun & Miscellaneous</h3>
        <Form.Group controlId="funFact">
          <Form.Label>Fun Fact</Form.Label>
          <Form.Control
            type="text"
            name="funFact"
            value={profile.funFact}
            onChange={handleChange}
            placeholder="Share a fun fact about yourself"
          />
        </Form.Group>
        <Form.Group controlId="goals">
          <Form.Label>Goals</Form.Label>
          <Form.Control
            type="text"
            name="goals"
            value={profile.goals}
            onChange={handleChange}
            placeholder="Your goals or aspirations"
          />
        </Form.Group>
        <Form.Group controlId="achievements">
          <Form.Label>Achievements</Form.Label>
          <Form.Control
            type="text"
            name="achievements"
            value={profile.achievements}
            onChange={handleChange}
            placeholder="Notable achievements or milestones"
          />
        </Form.Group>
        <Form.Group controlId="personalQuote">
          <Form.Label>Personal Quote</Form.Label>
          <Form.Control
            type="text"
            name="personalQuote"
            value={profile.personalQuote}
            onChange={handleChange}
            placeholder="Your favourite quote or motto"
          />
        </Form.Group>
        <Form.Group controlId="socialLinks">
          <Form.Label>Social Links</Form.Label>
          <Form.Control
            type="text"
            name="socialLinks"
            value={profile.socialLinks}
            onChange={handleChange}
            placeholder="Provide any social media links (comma separated)"
          />
        </Form.Group>

        {/* Personality Values Section */}
        <h3>Personality Values</h3>
        {profile.personalityValues.map((pv, index) => (
          <Row key={index} className="align-items-end">
            <Col md={4}>
              <Form.Group controlId={`pvName${index}`}>
                <Form.Label>Value Name</Form.Label>
                <Form.Control
                  type="text"
                  value={pv.valueName}
                  onChange={(e) =>
                    handlePersonalityValueChange(
                      index,
                      'valueName',
                      e.target.value
                    )
                  }
                  placeholder="e.g., Honest, Adventurous"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId={`pvRating${index}`}>
                <Form.Label>Self Rating</Form.Label>
                <Form.Control
                  type="number"
                  min={1}
                  max={10}
                  value={pv.selfRating}
                  onChange={(e) =>
                    handlePersonalityValueChange(
                      index,
                      'selfRating',
                      Number(e.target.value)
                    )
                  }
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId={`pvFriends${index}`}>
                <Form.Check
                  type="checkbox"
                  label="Allow Friends to Rate"
                  checked={pv.friends}
                  onChange={(e) =>
                    handlePersonalityValueChange(
                      index,
                      'friends',
                      (e.target as HTMLInputElement).checked
                    )
                  }
                />
              </Form.Group>
            </Col>
            <Col md={2} className="mb-2">
              <Button
                variant="danger"
                onClick={() => removePersonalityValue(index)}
              >
                Remove
              </Button>
            </Col>
          </Row>
        ))}
        <Button
          variant="secondary"
          onClick={addPersonalityValue}
          className="mb-3"
        >
          Add Personality Value
        </Button>

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
