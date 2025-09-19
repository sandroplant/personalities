import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestionsFeed from '../QuestionsFeed';
import api from '../../services/api';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockedApi = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
};

describe('QuestionsFeed rating workflow', () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
    mockedApi.post.mockReset();
  });

  it('allows creating a rating question and renders the rating slider', async () => {
    const user = userEvent.setup();

    mockedApi.get.mockResolvedValueOnce({ data: [] });
    mockedApi.get.mockResolvedValueOnce({ data: { results: [] } });

    render(<QuestionsFeed />);

    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(2));

    const askButton = await screen.findByRole('button', { name: /ask a question/i });
    await user.click(askButton);

    const typeSelect = screen.getByLabelText(/question type/i);
    await user.selectOptions(typeSelect, 'rating');

    await waitFor(() =>
      expect(screen.queryByPlaceholderText('Option 1')).not.toBeInTheDocument()
    );

    const questionInput = screen.getByLabelText(/question text/i);
    await user.type(questionInput, 'How would you rate this experience?');

    mockedApi.post.mockResolvedValueOnce({ data: {} });

    mockedApi.get.mockResolvedValueOnce({
      data: {
        results: [
          {
            id: 1,
            text: 'How would you rate this experience?',
            tag: null,
            question_type: 'rating',
            options: [],
            is_anonymous: false,
            created_at: '2024-01-01T00:00:00Z',
            average_rating: 8.2,
            rating_count: 5,
          },
        ],
      },
    });

    const submitButton = screen.getByRole('button', { name: /post question/i });
    await user.click(submitButton);

    await waitFor(() => expect(mockedApi.post).toHaveBeenCalledTimes(1));

    expect(mockedApi.post).toHaveBeenCalledWith('/questions/questions/', {
      text: 'How would you rate this experience?',
      is_anonymous: false,
      question_type: 'rating',
      options: [],
    });

    const slider = await screen.findByRole('slider', { name: /rating slider/i });
    expect(slider).toBeInTheDocument();
    expect(screen.getByText('How would you rate this experience?')).toBeInTheDocument();
  });
});
