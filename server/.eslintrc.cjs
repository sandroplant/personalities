/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['../.eslintrc.cjs'], // Extends the root configuration
  parserOptions: {
    project: [__dirname + '/../tsconfig.eslint.json'],
    tsconfigRootDir: __dirname + '/..',
  },
  env: {
    node: true, // Enables Node.js globals
    browser: false,
  },
  rules: {
    // Specify any server-specific ESLint rules here
  },
};
