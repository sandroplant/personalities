// frontend/src/components/FriendsEvaluations.tsx
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

type TasksResponse = {
  tasks: EvaluationTask[];
  next_offset: number | null;
};

const FriendsEvaluations: React.FC = () => {
  const [queue, setQueue] = useState<EvaluationTask[]>([]);
  const [current, setCurrent] = useState<EvaluationTask | null>(null);
  const [nextOffset, setNextOffset] = useState<number | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [fetchingMore, setFetchingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [familiarity, setFamiliarity] = useState<number>(5);
  const [score, setScore] = useState<number>(5);
  const [submitting, setSubmitting] = useState<boolean>(false);

  async function fetchPage(offset: number | null) {
    const opts = offset !== null ? { params: { offset } } : undefined;
    const res = await api.get<TasksResponse>('/evaluations/tasks/', opts);
    const data = res?.data ?? { tasks: [], next_offset: null };
    return {
      tasks: (data.tasks ?? []) as EvaluationTask[],
      nextOffset: (data.next_offset ?? null) as number | null,
    };
  }

  // Initial load
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { tasks, nextOffset: no } = await fetchPage(null);
        setQueue(tasks);
        setNextOffset(no);
        setCurrent(tasks[0] ?? null);
      } catch {
        setError('Failed to load evaluation tasks');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Advance to the next task; if queue is empty but we have nextOffset, fetch more
  const nextTask = async () => {
    const [, ...rest] = queue;
    if (rest.length > 0) {
      setQueue(rest);
      setCurrent(rest[0] ?? null);
      setFamiliarity(5);
      setScore(5);
      return;
    }

    // Need to fetch the next page
    if (nextOffset !== null && !fetchingMore) {
      try {
        setFetchingMore(true);
        const { tasks, nextOffset: no } = await fetchPage(nextOffset);
        setQueue(tasks);
        setNextOffset(no);
        setCurrent(tasks[0] ?? null);
      } catch {
        setError('Failed to load more evaluation tasks');
        setCurrent(null);
      } finally {
        setFetchingMore(false);
        setFamiliarity(5);
        setScore(5);
      }
    } else {
      // No more data
      setQueue([]);
      setCurrent(null);
      setFamiliarity(5);
      setScore(5);
    }
  };

  const handleSubmit = async () => {
    if (!current) return;
    setSubmitting(true);
    try {
      const payload: Record<string, number> = {
        criterion_id: current.criterionId,
        score,
      };
      if (current.firstTime) {
        payload.familiarity = familiarity;
      }
      await api.post(
        `/evaluations/evaluations/?subject_id=${current.subjectId}`,
        payload
      );
    } catch {
      // best-effort; still advance
    } finally {
      setSubmitting(false);
      void nextTask();
    }
  };

  const handleSkip = () => {
    void nextTask();
  };

  const onFamiliarityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFamiliarity(Number(e.target.value));
  };

  const onScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScore(Number(e.target.value));
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
                  onChange={onFamiliarityChange}
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
              onChange={onScoreChange}
            />
            <div>Selected: {score}</div>
          </Form.Group>

          <div className="d-flex justify-content-between">
            <Button
              variant="secondary"
              onClick={handleSkip}
              disabled={submitting || fetchingMore}
            >
              {fetchingMore ? 'Loading…' : 'Skip'}
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default FriendsEvaluations;
