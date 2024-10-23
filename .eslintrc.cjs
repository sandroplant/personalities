/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.eslint.json'],
    tsconfigRootDir: __dirname,
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    browser: true,
    node: true,
    es2021: true,
    jest: true, // Jest environment
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'react',
    'react-hooks',
    'prettier',
    'jest', // Jest plugin
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jest/recommended', // Jest recommended rules
    'plugin:prettier/recommended',
    'prettier',
  ],
  rules: {
    'prettier/prettier': 'error',
    // Add or customize other rules as needed
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        moduleDirectory: ['node_modules', 'node_modules/@types'],
      },
      typescript: {
        alwaysTryTypes: true,
        project: ['./tsconfig.eslint.json'],
      },
    },
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    'personalities-backup/',
    'server/services/',
    'server/testOpenAI.ts',
    'server/src/middleware/csrfMiddleware.d.ts', // Exclude this file
    'client/jest.config.js',
    'client/webpack.config.js',
    'client/webpack.config.ts',
    'client/src/reportWebVitals.d.ts',
  ],
  overrides: [
    {
      files: ['server/**/*.ts'],
      env: {
        node: true,
      },
      extends: ['plugin:@typescript-eslint/recommended', 'eslint:recommended'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        'prefer-const': 'error',
        'no-undef': 'off', // Disable 'no-undef' for TypeScript files
        'no-unused-vars': 'off', // Disable core 'no-unused-vars' rule
        '@typescript-eslint/no-unused-vars': [
          'warn',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
      },
    },
    {
      files: ['client/src/**/*.{ts,tsx,js,jsx}'],
      env: {
        browser: true,
      },
      extends: [
        'plugin:react/recommended',
        'plugin:@typescript-eslint/recommended',
        'eslint:recommended',
      ],
      rules: {
        'react/react-in-jsx-scope': 'off',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/no-explicit-any': 'off',
        'no-undef': 'off', // Disable 'no-undef' for TypeScript files
      },
    },
    {
      files: ['*.test.ts', '*.test.tsx'], // Apply to test files
      env: {
        jest: true,
      },
      plugins: ['jest'],
      extends: ['plugin:jest/recommended'],
      rules: {
        'no-undef': 'off', // Disable 'no-undef' for test files
        '@typescript-eslint/no-unused-vars': [
          'warn',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
      },
    },
  ],
};
