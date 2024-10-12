/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.eslint.base.json'],
    tsconfigRootDir: __dirname,
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  plugins: ['@typescript-eslint', 'import', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/unbound-method': 'off',
    // Add any other specific rules here if needed
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
        project: ['./tsconfig.eslint.base.json'],
      },
    },
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'personalities-backup/',
  ],
  overrides: [
    {
      files: ['server/**/*.ts'],
      env: {
        node: true,
      },
      extends: [
        'plugin:@typescript-eslint/recommended',
        'eslint:recommended',
      ],
      rules: {
        // Add or override server-specific ESLint rules here
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
        // Add or override client-specific ESLint rules here
      },
    }
  ]  
};
