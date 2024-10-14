import { Request, Response, NextFunction } from 'express';

function verifyCsrfToken(req: Request, res: Response, next: NextFunction): void {
  const csrfToken = req.headers['x-csrf-token'];

  if (csrfToken === 'valid-token') {
    next();
  } else {
    res.status(403).json({ error: 'Invalid CSRF token' });
  }
}

export { verifyCsrfToken };
