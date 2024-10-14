import crypto from 'crypto';
function csrfProtection(req, res, next) {
    if (!req.cookies._csrf) {
        const csrfToken = crypto.randomBytes(24).toString('hex');
        res.cookie('_csrf', csrfToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000,
        });
    }
    next();
}
function verifyCsrfToken(req, res, next) {
    const csrfTokenFromRequest = req.body._csrf || req.query._csrf || req.headers['x-csrf-token'];
    const csrfTokenFromCookie = req.cookies._csrf;
    if (req.method !== 'GET' && csrfTokenFromRequest !== csrfTokenFromCookie) {
        return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    next();
}
export { csrfProtection, verifyCsrfToken };
