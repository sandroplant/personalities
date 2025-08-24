// src/config/options.ts

/**
 * Enum representing the different categories of options.
 */
export enum OptionCategory {
  Hobbies = 'hobbies',
  Interests = 'interests',
  Professions = 'professions',
  EducationLevels = 'educationLevels',
  // Add more categories as needed
}

/**
 * Interface defining the structure of configuration options.
 */
export interface Options {
  readonly [OptionCategory.Hobbies]: readonly string[];
  readonly [OptionCategory.Interests]: readonly string[];
  readonly [OptionCategory.Professions]: readonly string[];
  readonly [OptionCategory.EducationLevels]: readonly string[];
  // Extend with additional categories as needed
}

/**
 * Static configuration options used across the application.
 */
const options: Record<string, string[]> = {
  eyeColor: ['Blue', 'Green', 'Brown', 'Hazel', 'Gray'],
  height: ['Short', 'Average', 'Tall'],
  weight: ['Light', 'Average', 'Heavy'],
  bodyType: ['Slim', 'Athletic', 'Curvy', 'Average'],
  hairColor: ['Blonde', 'Brown', 'Black', 'Red', 'Gray'],
  skinColor: ['Fair', 'Medium', 'Olive', 'Dark'],
  /**
   * Additional physical traits
   */
  hairStyle: ['Short', 'Medium', 'Long', 'Curly', 'Straight', 'Wavy', 'Bald'],
  skinTone: ['Fair', 'Medium', 'Olive', 'Dark'],
  tattoosPiercings: ['None', 'Tattoos', 'Piercings', 'Both'],
  hobbies: ['Reading', 'Traveling', 'Cooking', 'Gaming', 'Sports'],
  interests: ['Technology', 'Art', 'Music', 'Science', 'Literature'],
  professions: ['Engineer', 'Doctor', 'Artist', 'Teacher', 'Developer'],
  educationLevels: [
    'High School',
    "Bachelor's Degree",
    "Master's Degree",
    'PhD',
  ],
  /**
   * Basic information options
   */
  ageGroup: [
    'Under 18',
    '18-24',
    '25-34',
    '35-44',
    '45-54',
    '55-64',
    '65+',
  ],
  genderIdentity: [
    'Male',
    'Female',
    'Non-binary',
    'Genderqueer',
    'Transgender',
    'Other',
    'Prefer not to say',
  ],
  // Pronoun options limited to traditional male and female pronouns
  pronouns: ['He/Him', 'She/Her'],
  zodiacSign: [
    'Aries',
    'Taurus',
    'Gemini',
    'Cancer',
    'Leo',
    'Virgo',
    'Libra',
    'Scorpio',
    'Sagittarius',
    'Capricorn',
    'Aquarius',
    'Pisces',
  ],

  /**
   * Languages (commonly spoken)
   */
  languages: [
    'English',
    'Spanish',
    'Mandarin',
    'Hindi',
    'French',
    'Arabic',
    'Bengali',
    'Portuguese',
    'Russian',
    'Japanese',
    'German',
    'Other',
  ],

  /**
   * Lifestyle & habits options
   */
  diet: ['Omnivore', 'Vegetarian', 'Vegan', 'Pescatarian', 'Other'],
  exerciseFrequency: [
    'Never',
    'Rarely',
    'Sometimes',
    'Often',
    'Daily',
  ],
  smoking: ['Non-smoker', 'Occasional', 'Regular'],
  drinking: ['Non-drinker', 'Social', 'Regular'],
  pets: ['None', 'Dog', 'Cat', 'Bird', 'Fish', 'Reptile', 'Other'],

  /**
   * Favorites options (can be extended; most favourites are free text)
   */
  favoriteSport: [
    'Football',
    'Basketball',
    'Baseball',
    'Soccer',
    'Tennis',
    'Volleyball',
    'Hockey',
    'Cricket',
    'Other',
  ],
  favoritePodcasts: [],
  favoriteInfluencers: [],
  // Additional favorites (songs, artists, movies, tv shows, food, travel destinations) are left as free text inputs
  // Add more options as needed
};

export default options;
