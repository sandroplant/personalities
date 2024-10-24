// server/src/utils/spotifyAuth.ts

import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { query, validationResult } from 'express-validator';
import {
    generateCodeVerifier,
    generateCodeChallenge,
} from '../utils/spotifyAuthUtils.js';
import ensureAuthenticated from '../middleware/authMiddleware.js';
import axios, { AxiosResponse, isAxiosError } from 'axios'; // Updated import
import { rateLimit } from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import csrfTokens from 'csrf';
import sanitizeHtml from 'sanitize-html';
import '../config/env.js';
// Removed import for SpotifyTokenResponse from 'spotify-web-api-node'

const router = express.Router();

// Access environment variables
const client_id = process.env.SPOTIFY_CLIENT_ID as string;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET as string;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI as string;
const scope =
    'user-read-private user-read-email user-top-read user-read-currently-playing';

// Extend Express Session interface to include Spotify properties
declare module 'express-session' {
    interface SessionData {
        code_verifier?: string;
        state?: string;
        access_token?: string;
        refresh_token?: string;
        csrfSecret?: string;
    }
}

// Define SpotifyTrack interface
interface SpotifyTrack {
    name: string;
    uri: string;
    album: string;
}

// Define SpotifyArtist interface
interface SpotifyArtist {
    name: string;
    uri: string;
    genres: string[];
}

// Define SpotifyTopArtistsResponse interface
interface SpotifyTopArtistsResponse {
    items: SpotifyArtist[];
}

// Define SpotifyTopTracksResponse interface
interface SpotifyTopTracksResponse {
    items: SpotifyTrack[];
}

// Define SpotifyCurrentlyPlayingResponse interface
interface SpotifyCurrentlyPlayingResponse {
    item: {
        name: string;
        uri: string;
        album: {
            name: string;
        };
        artists: Array<{
            name: string;
        }>;
    };
}

// Define SpotifyTokenResponse interface
interface SpotifyTokenResponse {
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
    refresh_token: string;
    error?: string;
    error_description?: string;
}

// Initialize CSRF Tokens
const csrf = new csrfTokens();

// Rate Limiter to prevent abuse
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per window
    message: 'Too many requests, please try again later.',
});

// Middleware for sanitizing user input
const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
    req.query = mongoSanitize.sanitize(req.query);
    next();
};

// Helper function to safely handle errors
const handleError = (res: Response, message: string, error: unknown) => {
    if (error instanceof Error) {
        console.error(message, error.message);
    } else {
        console.error(message, error);
    }
    res.status(500).json({ message });
};

/**
 * @route   GET /spotifyAuth/login
 * @desc    Initiate Spotify authorization flow
 * @access  Public
 */
router.get('/login', authRateLimiter, (req: Request, res: Response) => {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const state = crypto.randomBytes(16).toString('hex');

    // Store codeVerifier and state in session to validate later
    req.session.code_verifier = codeVerifier;
    req.session.state = state;

    // Generate CSRF secret and store it in session
    const csrfSecret = csrf.secretSync();
    req.session.csrfSecret = csrfSecret;

    // Set CSRF token as a cookie for the client to use in subsequent requests
    res.cookie('XSRF-TOKEN', csrf.create(csrfSecret), {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false,
        sameSite: 'strict',
    });

    const authorizeURL =
        'https://accounts.spotify.com/authorize?' +
        new URLSearchParams({
            response_type: 'code',
            client_id: client_id,
            redirect_uri: redirect_uri,
            scope: scope,
            state: state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        }).toString();

    res.redirect(authorizeURL);
});

/**
 * @route   GET /spotifyAuth/callback
 * @desc    Handle Spotify callback and exchange code for access token
 * @access  Public
 */
router.get(
    '/callback',
    authRateLimiter,
    sanitizeInput,
    [
        // Validate and sanitize the query parameters
        query('code').isString().withMessage('Invalid code').trim(),
        query('state').isString().withMessage('Invalid state').trim(),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.redirect(
                '/#' +
                    new URLSearchParams({ error: 'invalid_request' }).toString()
            );
        }

        const code = req.query.code as string;
        const state = req.query.state as string;

        // Validate state parameter to prevent CSRF
        if (!state || state !== req.session.state) {
            return res.redirect(
                '/#' +
                    new URLSearchParams({ error: 'invalid_state' }).toString()
            );
        }

        if (!code) {
            return res.redirect(
                '/#' + new URLSearchParams({ error: 'no_code' }).toString()
            );
        }

        const codeVerifier = req.session.code_verifier;

        if (!codeVerifier) {
            return res.redirect(
                '/#' +
                    new URLSearchParams({
                        error: 'no_code_verifier',
                    }).toString()
            );
        }

        try {
            const response: AxiosResponse<SpotifyTokenResponse> =
                await axios.post(
                    'https://accounts.spotify.com/api/token',
                    new URLSearchParams({
                        grant_type: 'authorization_code',
                        code: code,
                        redirect_uri: redirect_uri,
                        code_verifier: codeVerifier,
                    }).toString(),
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            Authorization:
                                'Basic ' +
                                Buffer.from(
                                    `${client_id}:${client_secret}`
                                ).toString('base64'),
                        },
                    }
                );

            const data = response.data;

            if (data.access_token && data.refresh_token) {
                // Securely store tokens in session
                req.session.access_token = data.access_token;
                req.session.refresh_token = data.refresh_token;

                // Clear codeVerifier and state from session
                delete req.session.code_verifier;
                delete req.session.state;

                res.redirect('/profile'); // Redirect to the profile page after successful login
            } else {
                res.redirect(
                    '/#' +
                        new URLSearchParams({
                            error:
                                data.error_description ||
                                'authorization_failed',
                        }).toString()
                );
            }
        } catch (error: unknown) {
            handleError(res, 'Error during token exchange:', error);
        }
    }
);

/**
 * @route   GET /spotifyAuth/profile
 * @desc    Fetch and display user Spotify profile data
 * @access  Private
 */
router.get(
    '/profile',
    ensureAuthenticated,
    authRateLimiter,
    async (req: Request, res: Response): Promise<void> => {
        const accessToken = req.session.access_token as string | undefined;

        if (!accessToken) {
            res.status(401).send('Access token missing. Please log in again.');
            return;
        }

        try {
            const headers = {
                Authorization: `Bearer ${accessToken}`,
            };

            const [
                topArtistsResponse,
                topTracksResponse,
                currentTrackResponse,
            ] = await Promise.all([
                axios.get<SpotifyTopArtistsResponse>(
                    'https://api.spotify.com/v1/me/top/artists?limit=10',
                    { headers }
                ),
                axios.get<SpotifyTopTracksResponse>(
                    'https://api.spotify.com/v1/me/top/tracks?limit=20',
                    { headers }
                ),
                axios.get<SpotifyCurrentlyPlayingResponse>(
                    'https://api.spotify.com/v1/me/player/currently-playing',
                    { headers }
                ),
            ]);

            const topArtistsData = topArtistsResponse.data;
            const topTracksData = topTracksResponse.data;
            const currentTrackData = currentTrackResponse.data;

            const profileData = {
                top_artists: Array.isArray(topArtistsData.items)
                    ? topArtistsData.items.map(
                          (artist: SpotifyArtist): SpotifyArtist => ({
                              name: sanitizeHtml(artist.name),
                              uri: sanitizeHtml(artist.uri),
                              genres: artist.genres.map((genre: string) =>
                                  sanitizeHtml(genre)
                              ),
                          })
                      )
                    : [],
                top_tracks: Array.isArray(topTracksData.items)
                    ? topTracksData.items.map(
                          (track: SpotifyTrack): SpotifyTrack => ({
                              name: sanitizeHtml(track.name),
                              uri: sanitizeHtml(track.uri),
                              album: sanitizeHtml(track.album),
                          })
                      )
                    : [],
                currently_playing:
                    currentTrackData && currentTrackData.item
                        ? {
                              name: sanitizeHtml(currentTrackData.item.name),
                              artist: Array.isArray(
                                  currentTrackData.item.artists
                              )
                                  ? currentTrackData.item.artists
                                        .map((artist) =>
                                            sanitizeHtml(artist.name)
                                        )
                                        .join(', ')
                                  : '',
                              uri: sanitizeHtml(currentTrackData.item.uri),
                              album: sanitizeHtml(
                                  currentTrackData.item.album.name
                              ),
                          }
                        : null,
            };

            res.json(profileData); // Send only the required fields
        } catch (error: unknown) {
            if (isAxiosError(error) && error.response) {
                console.error(
                    'Error fetching profile data:',
                    error.response.data
                );
            } else if (error instanceof Error) {
                console.error('Error fetching profile data:', error.message);
            } else {
                console.error('Unknown error fetching profile data:', error);
            }
            res.status(500).send('Failed to fetch profile data');
        }
    }
);

export default router;
