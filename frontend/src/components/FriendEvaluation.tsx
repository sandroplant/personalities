import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Criterion {
  id: number;
  name: string;
}

interface FriendEvaluationProps {
  subjectId: number;
}

const FriendEvaluation: React.FC<FriendEvaluationProps> = ({ subjectId }) => {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [selectedCriterion, setSelectedCriterion] = useState<number | "">('');
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
            headers: {
              Authorization: token ? `Token ${token}` : '',
            },
          },
        );
        setCriteria(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load criteria');
      }
    };

    fetchCriteria();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCriterion) {
      setError('Please select a criterion');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_SERVER_URL}/evaluations/evaluations/?subject_id=${subjectId}`,
        {
          criterion_id: selectedCriterion,
          score: score,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Token ${token}` : '',
          },
        },
      );
      setSuccessMessage('Evaluation submitted successfully!');
      // Reset form
      setSelectedCriterion('');
      setScore(5);
    } catch (err) {
      console.error(err);
      setError('Failed to submit evaluation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Evaluate Friend</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '8px' }}>
          <label htmlFor="criterion" style={{ marginRight: '8px' }}>Criterion:</label>
          <select
            id="criterion"
            value={selectedCriterion}
            onChange={(e) => setSelectedCriterion(Number(e.target.value))}
          >
            <option value="">Select criterion</option>
            {criteria.map((criterion) => (
              <option key={criterion.id} value={criterion.id}>
                {criterion.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <label htmlFor="score" style={{ marginRight: '8px' }}>Score:</label>
          <input
            id="score"
            type="number"
            min={1}
            max={10}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Evaluation'}
        </button>
      </form>
    </div>
  );
};

export default FriendEvaluation;
