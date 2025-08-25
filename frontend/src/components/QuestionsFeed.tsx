import React, { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Spinner,
  Alert,
} from 'react-bootstrap';
import api from '../services/api';

/**
 * Type definitions for question and tag objects returned by the API.
 */
interface Tag {
  id: number;
  name: string;
}

interface Question {
  id: number;
  text: string;
  tag: Tag | null;
  tag_id?: number;
  options?: string[] | null;
  is_anonymous: boolean;
  created_at: string;
  yes_count: number;
  no_count: number;
}

/**
 * QuestionsFeed component
 *
 * Displays a list of questions pulled from the backend and provides
 * functionality to create new questions via a modal form. Users can
 * filter questions by tag and search text. The question list shows
 * aggregated answer counts (yes/no) and allows users to submit their
 * own answers.
 */
const QuestionsFeed: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for ask question modal
  const [showModal, setShowModal] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [modalTagId, setModalTagId] = useState<number | ''>('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Fetch tags and questions on mount. Also re-fetch when the selected
   * tag or search query changes. Uses query parameters to filter
   * questions by tag or search text. All calls require the user to be
   * authenticated.
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch tags
        const tagResponse = await api.get('/questions/tags/');
        setTags(tagResponse.data);
        // Fetch questions with optional filters
        const params: any = {};
        if (selectedTag) params.tag = selectedTag;
        if (search.trim()) params.search = search.trim();
        const questionResp = await api.get('/questions/questions/', { params });
        setQuestions(questionResp.data.results || questionResp.data);
      } catch (err) {
        console.error('Error loading questions or tags', err);
        setError('Failed to load questions.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedTag, search]);

  /**
   * Submit a new answer to a question. For yes/no polls the option
   * indices are 0 (Yes) and 1 (No). For multi-choice polls the index
   * corresponds to the selected option. Users are not prompted for
   * anonymity here; they can add anonymity in future iterations.
   */
  const submitAnswer = async (questionId: number, optionIndex: number) => {
    try {
      await api.post('/questions/answers/', {
        question_id: questionId,
        selected_option_index: optionIndex,
        is_anonymous: false,
      });
      // Refresh questions to update counts
      const params: any = {};
      if (selectedTag) params.tag = selectedTag;
      if (search.trim()) params.search = search.trim();
      const response = await api.get('/questions/questions/', { params });
      setQuestions(response.data.results || response.data);
    } catch (err) {
      console.error('Error submitting answer', err);
      alert('There was an error submitting your answer. Please try again.');
    }
  };

  /**
   * Handle submission of a new question from the modal. Validates
   * required fields and sends a POST request. If options are blank or
   * less than two items, the poll is treated as yes/no. Clears state
   * after successful submission.
   */
  const handleQuestionSubmit = async () => {
    if (!questionText.trim()) {
      alert('Question text cannot be empty.');
      return;
    }
    setSubmitting(true);
    try {
      const filteredOptions = options.filter((opt) => opt.trim());
      const payload: any = {
        text: questionText.trim(),
        is_anonymous: isAnonymous,
      };
      if (modalTagId) {
        payload.tag_id = modalTagId;
      }
      if (filteredOptions.length > 0) {
        payload.options = filteredOptions;
      }
      await api.post('/questions/questions/', payload);
      // Refresh list
      const params: any = {};
      if (selectedTag) params.tag = selectedTag;
      if (search.trim()) params.search = search.trim();
      const response = await api.get('/questions/questions/', { params });
      setQuestions(response.data.results || response.data);
      // Reset modal state
      setQuestionText('');
      setModalTagId('');
      setIsAnonymous(false);
      setOptions(['', '', '', '']);
      setShowModal(false);
    } catch (err) {
      console.error('Error creating question', err);
      alert('There was an error submitting your question. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="mt-4">
      <Row className="mb-3">
        <Col md={8}>
          <h2>Questions</h2>
        </Col>
        <Col md={4} className="text-md-end text-start">
          <Button onClick={() => setShowModal(true)}>Ask a Question</Button>
        </Col>
      </Row>
      {/* Filters */}
      <Row className="mb-3">
        <Col md={6} className="mb-2">
          <Form.Control
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
        <Col md={6} className="mb-2">
          <Form.Select
            value={selectedTag}
            onChange={(e) =>
              setSelectedTag(
                e.target.value === '' ? '' : parseInt(e.target.value)
              )
            }
          >
            <option value="">All Tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>
      {/* List of questions */}
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : questions.length === 0 ? (
        <p>No questions found.</p>
      ) : (
        <>
          {questions.map((q) => (
            <Card key={q.id} className="mb-3">
              <Card.Body>
                <Card.Title>{q.text}</Card.Title>
                {q.tag && <Card.Subtitle className="mb-2 text-muted">{q.tag.name}</Card.Subtitle>}
                {/* Display options and answer buttons */}
                {q.options && q.options.length > 0 ? (
                  <>
                    {q.options.map((opt, idx) => (
                      <Button
                        key={idx}
                        variant="outline-primary"
                        className="me-2 mb-2"
                        onClick={() => submitAnswer(q.id, idx)}
                      >
                        {opt}
                      </Button>
                    ))}
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline-success"
                      className="me-2"
                      onClick={() => submitAnswer(q.id, 0)}
                    >
                      Yes ({q.yes_count})
                    </Button>
                    <Button
                      variant="outline-danger"
                      onClick={() => submitAnswer(q.id, 1)}
                    >
                      No ({q.no_count})
                    </Button>
                  </>
                )}
              </Card.Body>
            </Card>
          ))}
        </>
      )}
      {/* Ask Question Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Ask a Question</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="questionText" className="mb-3">
              <Form.Label>Question Text</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Enter your question here..."
              />
            </Form.Group>
            <Form.Group controlId="tagSelect" className="mb-3">
              <Form.Label>Tag</Form.Label>
              <Form.Select
                value={modalTagId}
                onChange={(e) =>
                  setModalTagId(
                    e.target.value === '' ? '' : parseInt(e.target.value)
                  )
                }
              >
                <option value="">Select a tag</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group controlId="anonymousCheck" className="mb-3">
              <Form.Check
                type="checkbox"
                label="Post anonymously"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
            </Form.Group>
            <Form.Label>Answer Options (optional, up to 4)</Form.Label>
            {options.map((opt, idx) => (
              <Form.Control
                key={idx}
                type="text"
                className="mb-2"
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => {
                  const newOptions = [...options];
                  newOptions[idx] = e.target.value;
                  setOptions(newOptions);
                }}
              />
            ))}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleQuestionSubmit} disabled={submitting}>
            {submitting ? 'Posting...' : 'Post Question'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default QuestionsFeed;