// src/config/options.ts

interface Options {
  hobbies: string[];
  interests: string[];
  professions: string[];
  educationLevels: string[];
  [key: string]: string[];
}

const options: Options = {
  hobbies: ['Reading', 'Traveling', 'Cooking', 'Sports', 'Music', 'Art'],
  interests: [
    'Technology',
    'Science',
    'History',
    'Politics',
    'Health',
    'Fitness',
  ],
  professions: [
    'Engineer',
    'Doctor',
    'Teacher',
    'Artist',
    'Writer',
    'Scientist',
  ],
  educationLevels: [
    'High School',
    'Associate Degree',
    "Bachelor's Degree",
    "Master's Degree",
    'PhD',
  ],
};

export default options;
