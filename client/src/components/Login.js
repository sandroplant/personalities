import React, { useState } from 'react';
import axios from 'axios';
import { Alert, Form, Button, Container } from 'react-bootstrap';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_URL}/api/login`,
        { email, password },
        { withCredentials: true }
      );
      console.log('Login successful', response.data);
      // Handle successful login (e.g., redirect to dashboard)
    } catch (error) {
      console.error('Login error', error);
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <h2>Login</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group controlId="formPassword" className="mt-3">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Form.Group>
        <Button
          variant="primary"
          type="submit"
          className="mt-3"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </Form>
    </Container>
  );
}

export default Login;
