// src/types/express-session.d.ts

import 'express-session';
import session from 'express-session';
import { JwtPayload } from 'jsonwebtoken';

// Define an interface for the decoded JWT
interface DecodedToken extends JwtPayload {
  id: string;
  role?: string; // Optional: if you have roles
}

// Extend the SessionData interface to include custom session properties
declare module 'express-session' {
  interface SessionData {
    code_verifier?: string;
    state?: string;
    access_token?: string;
    refresh_token?: string;
    csrfSecret?: string;
    userId?: string; // Changed from 'user' to 'userId' to match authMiddleware.ts
    // Add any other session properties if needed
  }
}

// Extend the Request interface to include session and user properties
declare module 'express-serve-static-core' {
  interface Request {
    session: session.Session & Partial<session.SessionData>;
    user?: DecodedToken;
  }
}
