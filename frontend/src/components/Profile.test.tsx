import React from 'react';
import { render, screen } from '@testing-library/react';
import Profile from './Profile';
import api from '../services/api';

jest.mock('../services/api', () => ({
  get: jest.fn(),
}));

jest.mock('./EvaluationSummary', () => () => <div />);

describe('Profile component personality values', () => {
  it('renders personality values for arrays and scalars', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        full_name: 'Test User',
        personality_values: {
          Trust: 'High',
          Skills: ['Coding', 'Music'],
        },
      },
    });

    render(<Profile />);

    const trustLabel = await screen.findByText('Trust:');
    expect(trustLabel.parentElement).toHaveTextContent('Trust: High');

    const skillsLabel = await screen.findByText('Skills:');
    expect(skillsLabel.parentElement).toHaveTextContent(
      'Skills: Coding, Music'
    );
  });
});
