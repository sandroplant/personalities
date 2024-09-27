// /Users/aniavsa/Desktop/personalities/client/.eslintrc.js

module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'react-app',
    'react-app/jest',
    'plugin:prettier/recommended', // Integrate Prettier
  ],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
    // Add any custom rules if necessary
  },
};
