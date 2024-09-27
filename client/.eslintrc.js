module.exports = {
  extends: [
    '../eslint.config.mjs',
    'react-app',
    'react-app/jest',
    'plugin:prettier/recommended',
  ],
  env: {
    browser: true,
    es2021: true,
  },
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
  },
};
