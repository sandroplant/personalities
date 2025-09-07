// src/App.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders navbar brand', () => {
  render(<App />);
  const linkElement = screen.getByText(/Personalities/i);
  expect(linkElement).toBeInTheDocument();
});