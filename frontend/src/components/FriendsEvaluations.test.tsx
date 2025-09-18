import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import api from '../services/api';
import FriendsEvaluations from './FriendsEvaluations';

describe('FriendsEvaluations', () => {
  const mockedApi = api as jest.Mocked<typeof api>;

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('handles empty queue', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { tasks: [], next_offset: null },
    });

    render(<FriendsEvaluations />);

    await waitFor(() => {
      expect(
        screen.getByText(/No more friends to evaluate right now!/i)
      ).toBeInTheDocument();
    });
  });

  test('paginates using next_offset', async () => {
    mockedApi.get
      .mockResolvedValueOnce({
        data: {
          tasks: [
            {
              subjectId: 1,
              subjectName: 'Alice',
              criterionId: 1,
              criterionName: 'Kindness',
              firstTime: false,
            },
          ],
          next_offset: 5,
        },
      })
      .mockResolvedValueOnce({
        data: {
          tasks: [
            {
              subjectId: 2,
              subjectName: 'Bob',
              criterionId: 2,
              criterionName: 'Honesty',
              firstTime: false,
            },
          ],
          next_offset: null,
        },
      });

    render(<FriendsEvaluations />);

    // Wait for first task to load
    await screen.findByText(/Rate Alice on Kindness/);

    fireEvent.click(screen.getByText('Skip'));

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledTimes(2);
      expect(mockedApi.get).toHaveBeenNthCalledWith(2, '/evaluations/tasks/', {
        params: { offset: 5 },
      });
      expect(screen.getByText(/Rate Bob on Honesty/)).toBeInTheDocument();
    });
  });
});
