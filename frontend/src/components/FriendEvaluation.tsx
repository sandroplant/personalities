import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

interface Criterion {
  id: number;
  name: string;
}

interface FriendEvaluationProps {
  subjectId?: number;
}

const FriendEvaluation: React.FC<FriendEvaluationProps> = ({ subjectId }) => {
  const { subjectId: paramSubjectId } = useParams<{ subjectId?: string }>();
  const actualSubjectId =
    subjectId !== undefined
      ? subjectId
      : paramSubjectId
        ? parseInt(paramSubjectId, 10)
        : undefined;

  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [selectedCriterion, setSelectedCriterion] = useState<number | ''>('');
  const [score, setScore] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchCriteria = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${process.env.REACT_APP_SERVER_URL}/evaluations/criteria/`,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );
        setCriteria(response.data);
      } catch (err) {
        setError('Failed to load criteria');
      }
    };

    fetchCriteria();
  }, []);

  const handleCriterionChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value;
    setSelectedCriterion(value ? parseInt(value) : '');
    setError(null);
  };

  const handleScoreChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setScore(parseInt(event.target.value, 10));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!actualSubjectId || selectedCriterion === '') {
      setError('Please select a criterion and specify a subject.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_SERVER_URL}/evaluations/evaluations/?subject_id=${actualSubjectId}`,
        {
          criterion_id: selectedCriterion,
          score,
        },
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
      setSuccessMessage('Evaluation submitted successfully!');
      setSelectedCriterion('');
      setScore(5);
    } catch (err) {
      setError('Failed to submit evaluation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Evaluate Friend</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {successMessage && (
        <div className="text-green-500 mb-4">{successMessage}</div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Select Criterion
          </label>
          <select
            value={selectedCriterion}
            onChange={handleCriterionChange}
            className="w-full border border-gray-300 rounded p-2"
          >
            <option value="">-- Choose a criterion --</option>
            {criteria.map((criterion) => (
              <option key={criterion.id} value={criterion.id}>
                {criterion.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Score (1-10)</label>
          <input
            type="number"
            min="1"
            max="10"
            value={score}
            onChange={handleScoreChange}
            className="w-full border border-gray-300 rounded p-2"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white py-2 px-4 rounded"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Evaluation'}
        </button>
      </form>
    </div>
  );
};

export default FriendEvaluation;
