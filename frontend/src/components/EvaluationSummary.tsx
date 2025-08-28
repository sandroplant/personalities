import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Table, Spinner, Alert } from 'react-bootstrap';

interface SummaryItem {
  criterion_id: number;
  criterion_name: string;
  average_score: number;
}

interface EvaluationSummaryProps {
  userId: number;
}

const EvaluationSummary: React.FC<EvaluationSummaryProps> = ({ userId }) => {
  const [data, setData] = useState<SummaryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await api.get(
          `/evaluations/summary/?subject_id=${userId}`
        );
        setData(response.data);
      } catch (err: any) {
        console.error('Failed to load evaluation summary', err);
        setError(
          err.response?.data?.detail || 'Failed to load evaluation summary'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [userId]);

  if (loading) {
    return <Spinner animation="border" role="status" />;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (data.length === 0) {
    return <div>No evaluations yet.</div>;
  }

  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>Criterion</th>
          <th>Average Score</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={item.criterion_id}>
            <td>{item.criterion_name}</td>
            <td>{item.average_score.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default EvaluationSummary;
