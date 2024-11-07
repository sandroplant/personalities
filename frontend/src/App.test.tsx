// src/App.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByTestId('learn-react-link');
  expect(linkElement).toBeInTheDocument();
});