// server/src/routes/spotifyCallback.ts
import express from 'express';
import axios from 'axios';
import { query, validationResult } from 'express-validator';
import { generateCodeVerifier, generateCodeChallenge, } from '../utils/spotifyAuthUtils.js';
import csrfTokens from 'csrf'; // CSRF token handling
import rateLimit from 'express-rate-limit'; // Rate limiting to prevent abuse
import mongoSanitize from 'express-mongo-sanitize';
import '../config/env.js';
const router = express.Router();
const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, REDIRECT_URI } = process.env;
// Initialize CSRF Tokens
const csrf = new csrfTokens();
// Rate Limiter to prevent abuse
const callbackLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many requests, please try again later.',
});
// Middleware for sanitizing user input
const sanitizeInput = (req, _res, next) => {
    mongoSanitize.sanitize(req.query);
    next();
};
// Input validation and sanitization for the callback route
const validateCallback = [
    query('code')
        .notEmpty()
        .withMessage('Code is required')
        .isString()
        .withMessage('Code must be a string')
        .trim(),
    query('state')
        .notEmpty()
        .withMessage('State is required')
        .isString()
        .withMessage('State must be a string')
        .trim(),
];
// GET /login - Start the authorization flow
router.get('/login', callbackLimiter, (req, res) => {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    // Store codeVerifier in session for later use
    req.session.code_verifier = codeVerifier;
    // Generate CSRF secret and store it in session
    const csrfSecret = csrf.secretSync();
    req.session.csrfSecret = csrfSecret;
    // Set CSRF token as a cookie for the client to use in subsequent requests
    res.cookie('XSRF-TOKEN', csrf.create(csrfSecret), {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false,
        sameSite: 'strict',
    });
    const scopes = 'user-read-private user-read-email user-top-read user-library-read';
    const authorizationUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code_challenge=${codeChallenge}&code_challenge_method=S256&scope=${encodeURIComponent(scopes)}`;
    res.redirect(authorizationUrl);
});
// GET /callback - Handle the Spotify callback
router.get('/callback', callbackLimiter, sanitizeInput, validateCallback, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.redirect('/#error=invalid_request');
    }
    const { code, state } = req.query;
    if (typeof code !== 'string' || typeof state !== 'string') {
        return res.redirect('/#error=invalid_request');
    }
    // Retrieve codeVerifier from session
    const codeVerifier = req.session.code_verifier;
    if (!codeVerifier) {
        return res.redirect('/#error=missing_verifier');
    }
    // Validate CSRF token
    const csrfToken = req.cookies['XSRF-TOKEN'];
    const csrfSecret = req.session.csrfSecret;
    if (!csrfSecret || !csrfToken || !csrf.verify(csrfSecret, csrfToken)) {
        return res.redirect('/#error=invalid_csrf_token');
    }
    try {
        const response = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
            code_verifier: codeVerifier,
        }).toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
            },
        });
        const { access_token } = response.data;
        // Clear codeVerifier and CSRF secret from session after successful use
        delete req.session.code_verifier;
        delete req.session.csrfSecret;
        // Store access token securely in session
        req.session.access_token = access_token;
        // Redirect to profile page
        res.redirect('/profile');
    }
    catch (error) {
        console.error('Error during token exchange:', error.response ? error.response.data : error.message);
        res.redirect('/#error=token_exchange_failed');
    }
});
export default router;
