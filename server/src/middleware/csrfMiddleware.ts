// server/middleware/csrfMiddleware.ts

import { Request, Response, NextFunction, RequestHandler } from 'express';
import csrfTokens from 'csrf';
import '../config/env.js';

// Initialize CSRF Tokens
const csrf = new csrfTokens();

/**
 * Middleware for setting the CSRF token in a cookie.
 * Generates a CSRF secret if it doesn't exist and sets the token.
 */
const csrfProtection: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session) {
    next(new Error('Session not found'));
    return;
  }

  // Generate CSRF secret if it doesn't exist
  const secret = req.session.csrfSecret || csrf.secretSync();
  req.session.csrfSecret = secret;

  // Create a CSRF token using the secret
  const token = csrf.create(secret);

  // Set the token in a secure cookie
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false, // Allow client-side scripts to read the cookie
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000, // 1 hour
  });

  next();
};

/**
 * Middleware for verifying the CSRF token.
 * Compares the token from the request with the token stored in the session.
 */
const verifyCsrfToken: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session) {
    res.status(403).json({ error: 'Session not found' });
    return;
  }

  const secret = req.session.csrfSecret;
  if (!secret) {
    res.status(403).json({ error: 'CSRF secret not found' });
    return;
  }

  // Retrieve the CSRF token from the request headers
  const csrfTokenFromRequest =
    (req.headers['x-xsrf-token'] as string) ||
    (req.headers['x-csrf-token'] as string) ||
    req.body._csrf ||
    req.query._csrf;

  if (!csrfTokenFromRequest) {
    res.status(403).json({ error: 'CSRF token missing' });
    return;
  }

  // Verify the CSRF token
  if (!csrf.verify(secret, csrfTokenFromRequest)) {
    res.status(403).json({ error: 'Invalid CSRF token' });
    return;
  }

  next();
};

export { csrfProtection, verifyCsrfToken };
