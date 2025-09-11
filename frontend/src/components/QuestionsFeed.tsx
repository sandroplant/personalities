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
  question_type: 'yesno' | 'multiple_choice' | 'rating';
  options?: string[] | null;
  is_anonymous: boolean;
  created_at: string;
  yes_count?: number;
  no_count?: number;
  average_rating?: number;
  rating_count?: number;
}

/**
 * QuestionsFeed component
 *
 * Displays a list of questions pulled from the backend and provides
 * functionality to create new questions via a modal form. Users can
 * filter questions by tag and search text, choose the sort order, and
 * optionally create a custom tag when posting a question.
 */
const QuestionsFeed: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'trending' | 'recent'>('trending');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for ask question modal
  const [showModal, setShowModal] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [modalTagId, setModalTagId] = useState<number | ''>('');
  const [customTag, setCustomTag] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [ratings, setRatings] = useState<Record<number, number>>({});

  /**
   * Fetch tags and questions on mount. Also re-fetch when the selected
   * tag, search query, or sort mode changes. Uses query parameters to filter
   * questions by tag or search text and to specify sorting.
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
        if (sort === 'recent') params.sort = 'recent';
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
  }, [selectedTag, search, sort]);

  /**
   * Submit a new answer to a question. For yes/no polls the option
   * indices are 0 (Yes) and 1 (No). For multi-choice polls the index
   * corresponds to the selected option.
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
      if (sort === 'recent') params.sort = 'recent';
      const response = await api.get('/questions/questions/', { params });
      setQuestions(response.data.results || response.data);
    } catch (err) {
      console.error('Error submitting answer', err);
      alert('There was an error submitting your answer. Please try again.');
    }
  };

  const submitRating = async (questionId: number, rating: number) => {
    try {
      await api.post('/questions/answers/', {
        question_id: questionId,
        rating,
        is_anonymous: false,
      });
      // Refresh questions to show updated rating results
      const params: any = {};
      if (selectedTag) params.tag = selectedTag;
      if (search.trim()) params.search = search.trim();
      if (sort === 'recent') params.sort = 'recent';
      const response = await api.get('/questions/questions/', { params });
      setQuestions(response.data.results || response.data);
    } catch (err) {
      console.error('Error submitting rating', err);
      alert('There was an error submitting your rating. Please try again.');
    }
  };

  /**
   * Handle submission of a new question from the modal. Validates
   * required fields and sends a POST request. If options are blank
   * or less than two items, the poll is treated as yes/no. Clears state
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
        question_type: filteredOptions.length > 0 ? 'multiple_choice' : 'yesno',
      };
      // Prioritize custom tag over selected tag
      if (customTag.trim()) {
        payload.tag_name = customTag.trim();
      } else if (modalTagId) {
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
      if (sort === 'recent') params.sort = 'recent';
      const response = await api.get('/questions/questions/', { params });
      setQuestions(response.data.results || response.data);
      // Reset modal state
      setQuestionText('');
      setModalTagId('');
      setCustomTag('');
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
        <Col md={4} className="mb-2">
          <Form.Control
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
        <Col md={4} className="mb-2">
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
        <Col md={4} className="mb-2">
          <Form.Select
            value={sort}
            onChange={(e) =>
              setSort(e.target.value === 'recent' ? 'recent' : 'trending')
            }
          >
            <option value="trending">Trending</option>
            <option value="recent">Recent</option>
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
                {q.tag && (
                  <Card.Subtitle className="mb-2 text-muted">
                    {q.tag.name}
                  </Card.Subtitle>
                )}
                {/* Display options and answer inputs */}
                {q.question_type === 'rating' ? (
                  <>
                    <Form.Range
                      min={1}
                      max={10}
                      value={ratings[q.id] || 5}
                      onChange={(e) =>
                        setRatings({ ...ratings, [q.id]: parseInt(e.target.value) })
                      }
                      className="mb-2"
                    />
                    <div className="mb-2">Rating: {ratings[q.id] || 5}</div>
                    {typeof q.average_rating === 'number' && (
                      <div className="mb-2">
                        Average: {q.average_rating.toFixed(1)} (
                        {q.rating_count ?? 0} votes)
                      </div>
                    )}
                    <Button
                      variant="primary"
                      onClick={() => submitRating(q.id, ratings[q.id] || 5)}
                    >
                      Submit Rating
                    </Button>
                  </>
                ) : q.options && q.options.length > 0 ? (
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
                      Yes ({q.yes_count ?? 0})
                    </Button>
                    <Button
                      variant="outline-danger"
                      onClick={() => submitAnswer(q.id, 1)}
                    >
                      No ({q.no_count ?? 0})
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
              <Form.Label>Select a tag</Form.Label>
              <Form.Select
                value={modalTagId}
                onChange={(e) =>
                  setModalTagId(
                    e.target.value === '' ? '' : parseInt(e.target.value)
                  )
                }
              >
                <option value="">Choose from existing tags</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group controlId="customTag" className="mb-3">
              <Form.Label>Custom Tag (optional)</Form.Label>
              <Form.Control
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Enter a new tag (e.g., family guy)"
              />
              <Form.Text className="text-muted">
                Leave this blank to use the selected tag above.
              </Form.Text>
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
          <Button
            variant="secondary"
            onClick={() => setShowModal(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleQuestionSubmit}
            disabled={submitting}
          >
            {submitting ? 'Posting...' : 'Post Question'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default QuestionsFeed;
