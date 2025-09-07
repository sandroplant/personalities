// src/App.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('./components/Login', () => () => <div />);
jest.mock('./components/Register', () => () => <div />);
jest.mock('./components/Profile', () => () => <div />);
jest.mock('./components/ProfileForm', () => () => <div />);
jest.mock('./components/FriendEvaluation', () => () => <div />);
jest.mock('./components/FriendsEvaluations', () => () => <div />);
jest.mock('./components/QuestionsFeed', () => () => <div />);

const App = require('./App').default;

test('renders navigation brand', () => {
  render(<App />);
  const brand = screen.getByText('Personalities');
  expect(brand).toBeInTheDocument();
});