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
  hobbies: ['Reading', 'Traveling', 'Cooking', 'Gaming', 'Sports'],
  interests: ['Technology', 'Art', 'Music', 'Science', 'Literature'],
  professions: ['Engineer', 'Doctor', 'Artist', 'Teacher', 'Developer'],
  educationLevels: [
    'High School',
    "Bachelor's Degree",
    "Master's Degree",
    'PhD',
  ],
  // Add more options as needed
};

export default options;
