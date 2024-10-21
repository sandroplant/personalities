import React, { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import '../../../server/src/config/env.js';

const Register: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_URL}/api/register`,
        { email, password },
        { withCredentials: true }
      );
      console.log('Registration successful', response.data);
      setSuccess(true);
    } catch (error) {
      console.error('Registration error', error);
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    <Container className="mt-5">
      <h2>Register</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">Registration successful!</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            value={email}
            onChange={handleEmailChange}
            required
          />
        </Form.Group>
        <Form.Group controlId="formPassword" className="mt-3">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={handlePasswordChange}
            required
          />
        </Form.Group>
        <Button
          variant="primary"
          type="submit"
          className="mt-3"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </Button>
      </Form>
    </Container>
  );
};

export default Register;
