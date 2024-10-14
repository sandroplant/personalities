import { Request, Response, NextFunction } from 'express';
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });

function verifyCsrfToken(req: Request, res: Response, next: NextFunction) {
  // Dummy implementation for CSRF token verification
  const csrfToken = req.headers['x-csrf-token'];

  if (csrfToken === 'valid-token') {
    next();
  } else {
    res.status(403).json({ error: 'Invalid CSRF token' });
  }
}

export { csrfProtection, verifyCsrfToken };