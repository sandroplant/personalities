import { Request, Response, NextFunction } from 'express';

const verifyCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  const csrfToken = req.headers['x-csrf-token'];
  if (csrfToken && csrfToken === 'your-csrf-token') {
    next();
  } else {
    res.status(403).json({ error: 'Invalid CSRF token' });
  }
};

export default verifyCsrfToken;