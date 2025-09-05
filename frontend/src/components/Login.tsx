import React, { useState } from 'react';
import api from './services/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const tryEndpoints = async (emailVal: string, passwordVal: string): Promise<void> => {
    const endpoints = [
      '/auth/login/',
      '/custom_auth/login/',
      '/api/login/',
      '/api/token/', // JWT fallback
    ];
    let lastErr: any = null;
    for (const ep of endpoints) {
      // Build common payloads for different backends
      const jsonPayload = {
        email: emailVal,
        username: emailVal,
        password: passwordVal,
      } as any;
      try {
        // Try JSON first
        const res = await api.post(ep, jsonPayload, { withCredentials: true });
        if (res.status >= 200 && res.status < 300) {
          setSuccess('Login successful.');
          setError(null);
          return;
        }
      } catch (e: any) {
        lastErr = e;
        // If JSON failed, try form-encoded
        try {
          const form = new URLSearchParams();
          form.append('email', emailVal);
          form.append('username', emailVal);
          form.append('password', passwordVal);
          // SimpleJWT expects 'username' and 'password' (unless customized)
          if (ep === '/api/token/') {
            // Some setups use 'email' as username field; keep both in form
          }
          const res2 = await api.post(ep, form, {
            withCredentials: true,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });
          if (res2.status >= 200 && res2.status < 300) {
            setSuccess('Login successful.');
            setError(null);
            return;
          }
        } catch (e2: any) {
          lastErr = e2;
        }
      }
    }
    throw lastErr || new Error('Login failed');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      // Ensure CSRF cookie is set
      try { await api.get('/auth/csrf/', { withCredentials: true }); } catch {}
      await tryEndpoints(email, password);
    } catch (e: any) {
      console.error('Login error', e);
      const msg = e?.response?.data?.detail || e?.message || 'Login failed';
      setError(String(msg));
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 480 }}>
      <h2 className="mb-3">Login</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn btn-primary" type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
