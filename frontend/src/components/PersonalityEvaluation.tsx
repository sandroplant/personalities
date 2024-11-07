import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Spinner, Alert, ListGroup } from 'react-bootstrap';
import '../../../server/src/config/env.js';

interface Evaluation {
  id: string;
  name: string;
  score: number;
  criteria: string;
}

const PersonalityEvaluation: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const { data } = await axios.get<Evaluation[]>(
          `${process.env.REACT_APP_SERVER_URL}/api/evaluations`,
          { withCredentials: true }
        );
        setEvaluations(data);
        setError('');
      } catch (error) {
        console.error('Error fetching evaluations:', error);
        setError('Failed to fetch evaluations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, []);

  return (
    <Container className="mt-5">
      <h1>Personality Evaluations</h1>
      {loading && <Spinner animation="border" />}
      {error && <Alert variant="danger">{error}</Alert>}
      <ListGroup>
        {evaluations.map((evaluation) => (
          <ListGroup.Item key={evaluation.id}>
            <h3>{evaluation.name}</h3>
            <p>Score: {evaluation.score}</p>
            <p>Criteria: {evaluation.criteria}</p>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Container>
  );
};

export default PersonalityEvaluation;
