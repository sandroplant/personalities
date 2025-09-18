import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders initial app shell (spinner visible)', async () => {
  render(<App />);
  // assert spinner is present; this avoids conditional expects
  const spinner = await screen.findByRole('status');
  expect(spinner).toBeInTheDocument();
});
