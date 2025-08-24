import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Form, Spinner, Alert } from 'react-bootstrap';
import api from './services/api';

/**
 * FriendsEvaluations component
 *
 * This component drives the friend–evaluation flow. Rather than allowing users
 * to rate friends directly from their profiles, the app presents a series of
 * prompts pulled from the backend (or a local queue) asking the user to rate
 * one friend in a specific criterion. The user can also indicate how well
 * they know the friend on a 1–10 scale; this value is used to weight the
 * contribution of their rating on the friend’s overall score. Users may skip
 * any evaluation. After submitting or skipping, the next prompt appears.
 */
interface EvaluationTask {
  subjectId: number;
  subjectName: string;
  criterionId: number;
  criterionName: string;
  firstTime: boolean;
}

const FriendsEvaluations: React.FC = () => {
  const [queue, setQueue] = useState<EvaluationTask[]>([]);
  const [current, setCurrent] = useState<EvaluationTask | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [familiarity, setFamiliarity] = useState<number>(5);
  const [score, setScore] = useState<number>(5);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch a batch of evaluation tasks from the backend on mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // In a full implementation this would be a call like:
        // const response = await api.get('/evaluations/shuffle/');
        // setQueue(response.data);
        // For now, build a placeholder queue of friends and criteria.
        const mockQueue: EvaluationTask[] = [
          {
            subjectId: 2,
            subjectName: 'George',
            criterionId: 1,
            criterionName: 'Humor',
            firstTime: true,
          },
          {
            subjectId: 3,
            subjectName: 'Helen',
            criterionId: 4,
            criterionName: 'Open-mindedness',
            firstTime: true,
          },
          {
            subjectId: 2,
            subjectName: 'George',
            criterionId: 2,
            criterionName: 'Intellect',
            firstTime: false,
          },
        ];
        setQueue(mockQueue);
        setCurrent(mockQueue[0]);
      } catch (err) {
        setError('Failed to load evaluation tasks');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // Advance to the next task in the queue
  const nextTask = () => {
    setQueue((prev) => {
      const [, ...rest] = prev;
      setCurrent(rest[0] || null);
      return rest;
    });
    // Reset form state
    setFamiliarity(5);
    setScore(5);
  };

  const handleSubmit = async () => {
    if (!current) return;
    setSubmitting(true);
    try {
      // Submit evaluation to the backend
      // Include familiarity weighting when first time evaluating
      const payload: any = {
        criterion_id: current.criterionId,
        score,
      };
      if (current.firstTime) {
        payload.familiarity = familiarity;
      }
      await api.post(
        `/evaluations/evaluations/?subject_id=${current.subjectId}`,
        payload,
      );
    } catch (err) {
      console.error('Error submitting evaluation', err);
    } finally {
      setSubmitting(false);
      nextTask();
    }
  };

  const handleSkip = () => {
    nextTask();
  };

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
            <Button variant="secondary" onClick={handleSkip} disabled={submitting}>
              Skip
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
              Submit
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default FriendsEvaluations;