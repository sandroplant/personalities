import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import csrfTokens from 'csrf';

// Initialize Rate Limiter to prevent brute-force attacks on token verification
const rateLimiter = new RateLimiterMemory({
  points: 10, // Number of allowed attempts
  duration: 60, // Per 60 seconds
});

// Initialize CSRF Tokens
const csrf = new csrfTokens();

// Define an interface for the decoded JWT
interface DecodedToken extends JwtPayload {
  id: string;
  role?: string; // Optional: if you have roles
}

// Extend the Request interface to include user information and session
declare module 'express' {
  export interface Request {
    user?: DecodedToken;
    session?: any; // Assuming express-session is used
  }
}

// Middleware to ensure user is authenticated
const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    // Consume a point for each request
    await rateLimiter.consume(req.ip || '127.0.0.1');

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string, {
      algorithms: ['HS256'], // Specify allowed algorithms
    }) as DecodedToken;

    // Attach user information to the request object
    req.user = {
      id: decoded.id,
      role: decoded.role, // Example: if you have roles
    };

    // Generate CSRF token and set it as a cookie
    const secret = req.session?.csrfSecret || csrf.secretSync();
    req.session.csrfSecret = secret;
    res.cookie('XSRF-TOKEN', csrf.create(secret), {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false, // Ensure this matches your intended usage
      sameSite: 'lax',
    });

    next();
  } catch (err: any) {
    // Handle different JWT errors
    if (err.name === 'JsonWebTokenError') {
      res.status(401).json({ error: 'Invalid token.' });
    } else if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token has expired.' });
    } else {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
};

export default authMiddleware;