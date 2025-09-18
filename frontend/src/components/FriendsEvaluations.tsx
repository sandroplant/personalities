import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Form, Spinner, Alert } from 'react-bootstrap';
import api from '../services/api';

interface EvaluationTask {
  subjectId: number;
  subjectName: string;
  criterionId: number;
  criterionName: string;
  firstTime: boolean;
}

const FriendsEvaluations: React.FC = () => {
  const [_queue, setQueue] = useState<EvaluationTask[]>([]);
  const [current, setCurrent] = useState<EvaluationTask | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [familiarity, setFamiliarity] = useState<number>(5);
  const [score, setScore] = useState<number>(5);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await api.get('/evaluations/tasks/');
        const tasks: EvaluationTask[] = response.data;
        setQueue(tasks);
        setCurrent(tasks[0] || null);
      } catch {
        console.error('Failed to load evaluation tasks');
        setError('Failed to load evaluation tasks');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const nextTask = () => {
    setQueue((prev) => {
      const [, ...rest] = prev;
      setCurrent(rest[0] || null);
      return rest;
    });
    setFamiliarity(5);
    setScore(5);
  };

  const handleSubmit = async () => {
    if (!current) return;
    setSubmitting(true);
    try {
      const payload: any = { criterion_id: current.criterionId, score };
      if (current.firstTime) payload.familiarity = familiarity;
      await api.post(
        `/evaluations/evaluations/?subject_id=${current.subjectId}`,
        payload
      );
    } catch {
      console.error('Error submitting evaluation');
    } finally {
      setSubmitting(false);
      nextTask();
    }
  };

  const handleSkip = () => nextTask();

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!current) {
    return (
      <Container className="mt-5">
        <h3>No more friends to evaluate right now!</h3>
        <p>Come back later for more evaluation prompts.</p>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <Card className="mb-3">
        <Card.Body>
          {current.firstTime ? (
            <>
              <Card.Title>
                How well do you know {current.subjectName}?
              </Card.Title>
              <Form.Group controlId="familiarity" className="my-3">
                <Form.Label>Familiarity (1–10)</Form.Label>
                <Form.Range
                  min={1}
                  max={10}
                  value={familiarity}
                  onChange={(e) => setFamiliarity(parseInt(e.target.value))}
                />
                <div>Selected: {familiarity}</div>
              </Form.Group>
            </>
          ) : null}

          <Card.Title className="mt-3">
            Rate {current.subjectName} on {current.criterionName}
          </Card.Title>
          <Form.Group controlId="score" className="my-3">
            <Form.Label>Score (1–10)</Form.Label>
            <Form.Range
              min={1}
              max={10}
              value={score}
              onChange={(e) => setScore(parseInt(e.target.value))}
            />
            <div>Selected: {score}</div>
          </Form.Group>
          <div className="d-flex justify-content-between">
            <Button
              variant="secondary"
              onClick={handleSkip}
              disabled={submitting}
            >
              Skip
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              Submit
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default FriendsEvaluations;
