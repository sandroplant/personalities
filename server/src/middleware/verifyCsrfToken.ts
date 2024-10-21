// server/middleware/verifyCsrfToken.ts

import { Request, Response, NextFunction } from 'express';
import csrfTokens from 'csrf';

// Initialize CSRF Tokens
const csrf = new csrfTokens();

/**
 * Middleware for verifying the CSRF token.
 * Compares the token from the request with the token stored in the session.
 */
function verifyCsrfToken(req: Request, res: Response, next: NextFunction): void {
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
}

export { verifyCsrfToken };
