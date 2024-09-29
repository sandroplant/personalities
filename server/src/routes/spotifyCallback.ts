// server/routes/spotifyCallback.ts

import express, { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import type { AxiosResponse } from 'axios';
import {
    generateCodeVerifier,
    generateCodeChallenge,
} from '../utils/spotifyAuthUtils'; // Ensure correct path and TypeScript support
import { query, validationResult } from 'express-validator';

const router = express.Router();

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, REDIRECT_URI } = process.env;

// Interface for token response from Spotify
interface SpotifyTokenResponse {
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
    refresh_token?: string;
}

// Store code verifier for later use (better to store in session)
let codeVerifier = '';

// Input validation and sanitization for callback route
const validateCallback = [
    query('code').notEmpty().withMessage('Code is required').isString().withMessage('Code must be a string').trim().escape(),
    query('state').notEmpty().withMessage('State is required').isString().withMessage('State must be a string').trim().escape(),
];

router.get(
    '/callback',
    validateCallback,
    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.redirect('/#error=invalid_request');
        }

        const { code, state } = req.query;

        if (typeof code !== 'string' || typeof state !== 'string') {
            return res.redirect('/#error=invalid_request');
        }

        try {
            const response: AxiosResponse<SpotifyTokenResponse> = await axios.post(
                'https://accounts.spotify.com/api/token',
                new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: REDIRECT_URI as string,
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
        } catch (error: any) {
            console.error('Error during token exchange:', error.response ? error.response.data : error.message);
            res.redirect('/#error=token_exchange_failed');
        }
    }
);

// Interface for request
interface LoginRequest extends Request {}

// GET /login - Start the authorization flow
router.get('/login', (req: LoginRequest, res: Response, next: NextFunction) => {
    codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const scopes = 'user-read-private user-read-email user-top-read user-library-read';
    const authorizationUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI as string)}&code_challenge=${codeChallenge}&code_challenge_method=S256&scope=${encodeURIComponent(scopes)}`;

    res.redirect(authorizationUrl);
});

export default router;
