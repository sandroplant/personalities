// server/middleware/authMiddleware.ts
import jwt from 'jsonwebtoken';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import csrfTokens from 'csrf';
import '../config/env.js';
// Initialize Rate Limiter to prevent brute-force attacks on token verification
const rateLimiter = new RateLimiterMemory({
    points: 10,
    duration: 60, // Per 60 seconds
});
// Initialize CSRF Tokens
const csrf = new csrfTokens();
// Middleware to ensure user is authenticated
const authMiddleware = async (req, res, next) => {
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256'], // Specify allowed algorithms
        });
        // Attach user information to the request object
        req.user = {
            id: decoded.id,
            role: decoded.role, // Example: if you have roles
        };
        // Ensure session exists
        if (!req.session) {
            throw new Error('Session not found');
        }
        // Generate CSRF token and set it as a cookie
        const secret = req.session.csrfSecret || csrf.secretSync();
        req.session.csrfSecret = secret;
        res.cookie('XSRF-TOKEN', csrf.create(secret), {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: false,
            sameSite: 'strict',
        });
        next();
    }
    catch (err) {
        // Handle different JWT errors
        if (err instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token.' });
        }
        else if (err instanceof jwt.TokenExpiredError) {
            res.status(401).json({ error: 'Token has expired.' });
        }
        else if (err.message === 'Session not found') {
            res.status(500).json({ error: 'Session not found.' });
        }
        else {
            res.status(500).json({ error: 'Internal server error.' });
        }
    }
};
export default authMiddleware;
