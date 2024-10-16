// src/index.ts

// Note: dotenv is not required on the client side.
// Environment variables for the client should be handled via build-time configurations.

// Import styles (assuming you have a styles.css in the same directory)
import './styles.css';

// Use DOMContentLoaded to ensure the DOM is fully loaded before manipulating it
document.addEventListener('DOMContentLoaded', () => {
  const appDiv = document.createElement('div');
  appDiv.innerHTML = '<h1>Hello from Webpack!</h1>';
  document.body.appendChild(appDiv);
});
