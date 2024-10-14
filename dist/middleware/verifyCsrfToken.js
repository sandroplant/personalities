const verifyCsrfToken = (req, res, next) => {
    const csrfToken = req.headers['x-csrf-token'];
    if (csrfToken && csrfToken === 'your-csrf-token') {
        next();
    }
    else {
        res.status(403).json({ error: 'Invalid CSRF token' });
    }
};
export default verifyCsrfToken;
