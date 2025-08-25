import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import ProfileForm from './components/ProfileForm';
import FriendEvaluation from './components/FriendEvaluation';
import FriendsEvaluations from './components/FriendsEvaluations';
import QuestionsFeed from './components/QuestionsFeed';

function App() {
  return (
    <Router>
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand href="/">Personalities</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="/login">Login</Nav.Link>
              <Nav.Link href="/register">Register</Nav.Link>
              <Nav.Link href="/profile">Profile</Nav.Link>
              <Nav.Link href="/questions">Questions</Nav.Link>
              <Nav.Link href="/evaluations">Friends Evaluations</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/edit-profile" element={<ProfileForm />} />
        <Route path="/evaluate/:subjectId" element={<FriendEvaluation />} />
        <Route path="/evaluations" element={<FriendsEvaluations />} />
        <Route path="/questions" element={<QuestionsFeed />} />
      </Routes>
    </Router>
  );
}

export default App;
