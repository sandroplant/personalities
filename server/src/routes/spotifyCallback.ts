import express, { Request, Response } from 'express';
import axios, { AxiosResponse } from 'axios';
import { check, validationResult } from 'express-validator';
import {
  generateCodeVerifier,
  generateCodeChallenge,
} from '../utils/spotifyAuthUtils';
import csrfTokens from 'csrf'; // CSRF token handling
import rateLimit from 'express-rate-limit'; // Rate limiting to prevent abuse

const router = express.Router();

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, REDIRECT_URI } = process.env;

// Initialize CSRF Tokens
const csrf = new csrfTokens();

// Interface for token response from Spotify
interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

// Input validation and sanitization for the callback route
const validateCallback = [
  check('code')
    .notEmpty()
    .withMessage('Code is required')
    .isString()
    .withMessage('Code must be a string')
    .trim()
    .escape(),
  check('state')
    .notEmpty()
    .withMessage('State is required')
    .isString()
    .withMessage('State must be a string')
    .trim()
    .escape(),
];

// Apply rate limiting to the callback route
const callbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  message: 'Too many requests, please try again later.',
});

// GET /login - Start the authorization flow
router.get('/login', (req: Request, res: Response) => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Store codeVerifier in session for later use
  req.session.codeVerifier = codeVerifier;

  // Generate CSRF secret and store it in session
  const csrfSecret = csrf.secretSync();
  req.session.csrfSecret = csrfSecret;

  // Set CSRF token as a cookie for the client to use in subsequent requests
  res.cookie('XSRF-TOKEN', csrf.create(csrfSecret), {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
    sameSite: 'lax',
  });

  const scopes =
    'user-read-private user-read-email user-top-read user-library-read';
  const authorizationUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI as string
  )}&code_challenge=${codeChallenge}&code_challenge_method=S256&scope=${encodeURIComponent(scopes)}`;

  res.redirect(authorizationUrl);
});

// GET /callback - Handle the Spotify callback
router.get(
  '/callback',
  callbackLimiter,
  validateCallback,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.redirect('/#error=invalid_request');
    }

    const { code, state } = req.query;

    if (typeof code !== 'string' || typeof state !== 'string') {
      return res.redirect('/#error=invalid_request');
    }

    // Retrieve codeVerifier from session
    const codeVerifier = req.session.codeVerifier;
    if (!codeVerifier) {
      return res.redirect('/#error=missing_verifier');
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
        }
      });

      const { access_token } = response.data;

      // Clear codeVerifier from session after successful use
      delete req.session.codeVerifier;

      // Redirect to profile page with access token
      res.redirect(`/profile?access_token=${access_token}`);
    } catch (error: any) {
      console.error(
        'Error during token exchange:',
        error.response ? error.response.data : error.message
      );
      res.redirect('/#error=token_exchange_failed');
    }
  }
);

export default router;
