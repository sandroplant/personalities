/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true, // Ensures this configuration is the root
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: [__dirname + '/tsconfig.eslint.json'], // Absolute path to tsconfig
    tsconfigRootDir: __dirname,
    ecmaVersion: 2020, // Allows parsing of modern ECMAScript features
    sourceType: 'module', // Allows usage of imports
  },
  env: {
    browser: true, // Enables browser globals like window and document
    node: true, // Enables Node.js global variables and Node.js scoping
    es2021: true, // Adds all ECMAScript 2021 globals
  },
  plugins: ['@typescript-eslint', 'import', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    // Removed 'plugin:@typescript-eslint/recommended-requiring-type-checking' to simplify configuration
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier', // Integrates Prettier configuration
  ],
  rules: {
    // Specify any custom ESLint rules here
    // Temporarily disable problematic rules if needed
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/unbound-method': 'off',
  },
  settings: {
    react: {
      version: 'detect', // Automatically detects the React version
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        moduleDirectory: ['node_modules', 'node_modules/@types'],
      },
      typescript: {
        alwaysTryTypes: true, // Always attempt to resolve types under '@types' directory
        project: __dirname + '/tsconfig.eslint.json',
      },
    },
  },
  ignorePatterns: ['node_modules/', 'dist/', 'build/', 'personalities-backup/'],
};
