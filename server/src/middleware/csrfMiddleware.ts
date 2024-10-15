// src/middleware/csrfMiddleware.ts

import { Request, Response, NextFunction, RequestHandler } from 'express';
import crypto from 'crypto';

/**
 * Middleware for setting the CSRF token in a cookie.
 * If a CSRF token doesn't exist in the cookies, generate one and set it.
 */
const csrfProtection: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  // Check if a CSRF token is already set in the cookies
  if (!req.cookies._csrf) {
    // Generate a CSRF token if it's not set
    const csrfToken = crypto.randomBytes(24).toString('hex');

    // Set the token in a secure cookie
    res.cookie('_csrf', csrfToken, {
      httpOnly: true, // Cookie is not accessible via JavaScript
      secure: process.env.NODE_ENV === 'production', // Send only over HTTPS in production
      sameSite: 'strict', // Prevent cross-site request
      maxAge: 24 * 60 * 60 * 1000, // 1 day expiration
    });
  }

  next();
};

/**
 * Middleware for verifying the CSRF token.
 * Compares the token from the request with the token stored in the cookie.
 */
const verifyCsrfToken: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  // Retrieve the CSRF token from the request (header, body, or query string)
  const csrfTokenFromRequest =
    req.body._csrf || req.query._csrf || req.headers['x-csrf-token'];

  // Retrieve the CSRF token from the cookie
  const csrfTokenFromCookie = req.cookies._csrf;

  // Only check CSRF tokens for state-changing requests (non-GET)
  if (
    req.method !== 'GET' &&
    (!csrfTokenFromRequest || csrfTokenFromRequest !== csrfTokenFromCookie)
  ) {
    res.status(403).json({ error: 'Invalid CSRF token' });
    return;
  }

  // Proceed if the tokens match
  next();
};

export { csrfProtection, verifyCsrfToken };