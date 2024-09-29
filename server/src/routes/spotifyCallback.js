import express from 'express';
import axios from 'axios';
import {
    generateCodeVerifier,
    generateCodeChallenge,
} from '../utils/spotifyAuth.js'; // Updated to ES6 import
import { query, validationResult } from 'express-validator';

const router = express.Router();

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, REDIRECT_URI } = process.env;

// Store code verifier for later use
let codeVerifier = '';

// Input validation and sanitization for callback route
const validateCallback = [
    query('code').notEmpty().withMessage('Code is required').trim().escape(),
    query('state').notEmpty().withMessage('State is required').trim().escape(),
];

router.get('/callback', validateCallback, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.redirect('/#error=invalid_request');
    }

    const { code, state } = req.query;

    try {
        const response = await axios.post(
            'https://accounts.spotify.com/api/token',
            new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
                code_verifier: codeVerifier,
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
                },
            }
        );

        const { access_token } = response.data;

        // You can use the access_token to make authenticated requests to Spotify API
        res.redirect(`/profile?access_token=${access_token}`);
    } catch (error) {
        console.error('Error during token exchange:', error.response ? error.response.data : error.message);
        res.redirect('/#error=token_exchange_failed');
    }
});

router.get('/login', (req, res) => {
    codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const scopes = 'user-read-private user-read-email user-top-read user-library-read';
    const authorizationUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code_challenge=${codeChallenge}&code_challenge_method=S256&scope=${encodeURIComponent(scopes)}`;

    res.redirect(authorizationUrl);
});

export default router;