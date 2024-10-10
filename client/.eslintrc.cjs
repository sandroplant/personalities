/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['../.eslintrc.cjs'], // Extends the root configuration
  parserOptions: {
    project: [__dirname + '/../tsconfig.eslint.json'],
    tsconfigRootDir: __dirname + '/..',
  },
  env: {
    browser: true, // Enables browser globals
    node: false,
  },
  rules: {
    // Specify any client-specific ESLint rules here
  },
};
