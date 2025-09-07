// setupTests.ts
import '@testing-library/jest-dom';

// Provide a default server URL for tests if none is specified
process.env.REACT_APP_SERVER_URL =
  process.env.REACT_APP_SERVER_URL || 'http://localhost:80';
