// src/App.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders navigation brand', () => {
  render(<App />);
  expect(screen.getByText(/Personalities/i)).toBeInTheDocument();
});
