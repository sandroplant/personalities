import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Profile from './components/Profile';
import QuestionsFeed from './components/QuestionsFeed';
import FriendsEvaluations from './components/FriendsEvaluations';
import Login from './components/Login';
import Register from './components/Register';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/profile" replace />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/questions" element={<QuestionsFeed />} />
        <Route path="/evaluations" element={<FriendsEvaluations />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<div style={{ padding: 24 }}>Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

