import jwt from 'jsonwebtoken';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import csrfTokens from 'csrf';
const rateLimiter = new RateLimiterMemory({
    points: 10,
    duration: 60,
});
const csrf = new csrfTokens();
const authMiddleware = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Access denied. No token provided.' });
        return;
    }
    const token = authHeader.replace('Bearer ', '').trim();
    try {
        await rateLimiter.consume(req.ip || '127.0.0.1');
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256'],
        });
        req.user = {
            id: decoded.id,
            role: decoded.role,
        };
        const secret = req.session?.csrfSecret || csrf.secretSync();
        req.session.csrfSecret = secret;
        res.cookie('XSRF-TOKEN', csrf.create(secret), {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: false,
            sameSite: 'lax',
        });
        next();
    }
    catch (err) {
        if (err.name === 'JsonWebTokenError') {
            res.status(401).json({ error: 'Invalid token.' });
        }
        else if (err.name === 'TokenExpiredError') {
            res.status(401).json({ error: 'Token has expired.' });
        }
        else {
            res.status(500).json({ error: 'Internal server error.' });
        }
    }
};
export default authMiddleware;
