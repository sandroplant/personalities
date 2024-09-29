// server/middleware/authMiddleware.js

import jwt from 'jsonwebtoken';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Initialize Rate Limiter to prevent brute-force attacks on token verification
const rateLimiter = new RateLimiterMemory({
    points: 10, // Number of allowed attempts
    duration: 60, // Per 60 seconds
});

// Middleware to ensure user is authenticated
const authMiddleware = async (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    try {
        // Consume a point for each request
        await rateLimiter.consume(req.ip);

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256'], // Specify allowed algorithms
        });

        // Attach user information to the request object
        req.user = {
            id: decoded.id,
            role: decoded.role, // Example: if you have roles
            // Add other necessary fields from the token
        };

        next();
    } catch (err) {
        // If rate limiter rejects, send 429 Too Many Requests
        if (err instanceof Error && err.name === 'RateLimiterRes') {
            return res.status(429).send({ error: 'Too many authentication attempts. Please try again later.' });
        }

        // Log only the error message to avoid exposing sensitive information
        console.error('Authentication error:', err.message);

        // Differentiate between token verification errors and rate limiter errors
        if (err.name === 'JsonWebTokenError') {
            return res.status(400).send({ error: 'Invalid token.' });
        } else if (err.name === 'TokenExpiredError') {
            return res.status(400).send({ error: 'Token has expired.' });
        } else {
            return res.status(500).send({ error: 'Internal server error.' });
        }
    }
};

export default authMiddleware;
