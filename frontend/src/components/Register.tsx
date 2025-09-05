import React, { useState } from 'react';
import api from './services/api';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const tryEndpoints = async (payload: any): Promise<void> => {
    // Only target proxied API routes; avoid hitting the dev server itself
    const endpoints = [
      '/auth/register/',
      '/custom_auth/register/',
      '/api/register/',
    ];
    let lastErr: any = null;
    for (const ep of endpoints) {
      try {
        // Try JSON first
        const res = await api.post(ep, payload, { withCredentials: true });
        if (res.status >= 200 && res.status < 300) {
          setSuccess('Registration successful. You can now log in.');
          setError(null);
          return;
        }
      } catch (e: any) {
        lastErr = e;
        // Fallback: some backends expect form-encoded
        try {
          const form = new URLSearchParams();
          if (payload.email) form.append('email', payload.email);
          if (payload.username) form.append('username', payload.username);
          if (payload.password) form.append('password', payload.password);
          if (payload.password1) form.append('password1', payload.password1);
          if (payload.password2) form.append('password2', payload.password2);
          const res2 = await api.post(ep, form, {
            withCredentials: true,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });
          if (res2.status >= 200 && res2.status < 300) {
            setSuccess('Registration successful. You can now log in.');
            setError(null);
            return;
          }
        } catch (e2: any) {
          lastErr = e2;
        }
      }
    }
    throw lastErr || new Error('Registration failed');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      // Ensure CSRF cookie is set
      try { await api.get('/auth/csrf/', { withCredentials: true }); } catch {}
      const payload = {
        name,
        email,
        username: email,
        password,
        password1: password,
        password2: confirm || password,
      };
      await tryEndpoints(payload);
    } catch (e: any) {
      console.error('Registration error', e);
      const msg = e?.response?.data?.detail || e?.message || 'Registration failed';
      setError(String(msg));
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 480 }}>
      <h2 className="mb-3">Register</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input className="form-control" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Confirm Password (optional)</label>
          <input className="form-control" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <button className="btn btn-primary" type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
