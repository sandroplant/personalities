import React, { useState, ChangeEvent } from 'react';
import axios from 'axios';
import {
  TabContainer,
  Form,
  FormControl,
  FormGroup,
  FormProps,
} from 'react-bootstrap';
import FormLabel from 'react-bootstrap/FormLabel';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Alert from 'react-bootstrap/Alert';

// Define server URL with a fallback for tests and development
const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:80';

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit: FormProps['onSubmit'] = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${SERVER_URL}/api/login`,
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

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail((e.target as HTMLInputElement).value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword((e.target as HTMLInputElement).value);
  };

  return (
    <Container>
      <TabContainer></TabContainer>
      <h2>Login</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <FormGroup controlId="formEmail">
          <FormLabel>Email</FormLabel>
          <FormControl
            type="email"
            value={email}
            onChange={handleEmailChange}
            required
          />
        </FormGroup>
        <FormGroup controlId="formPassword" className="mt-3">
          <FormLabel>Password</FormLabel>
          <FormControl
            type="password"
            value={password}
            onChange={(e) =>
              handlePasswordChange(
                e as unknown as ChangeEvent<HTMLInputElement>
              )
            }
            required
          />
        </FormGroup>
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
};

export default Login;
