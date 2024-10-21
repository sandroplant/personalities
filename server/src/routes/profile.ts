// server/routes/profile.ts

import express, { Request, Response, NextFunction } from 'express';
import { check, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import SpotifyWebApi from 'spotify-web-api-node';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import csrfTokens from 'csrf'; // Import CSRF Tokens
import mongoSanitize from 'express-mongo-sanitize';
import sanitizeHtml from 'sanitize-html';
import ensureAuthenticated from '../middleware/authMiddleware.js';
import { verifyCsrfToken } from '../middleware/csrfMiddleware.js';
import '../config/env.js';

const router = express.Router();

// Initialize Rate Limiter to prevent excessive requests
const profileRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per window
  message: 'Too many profile requests, please try again later.',
});

// Initialize CSRF Tokens
const csrf = new csrfTokens();

// Middleware for sanitizing user input
const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  mongoSanitize.sanitize(req.body);
  mongoSanitize.sanitize(req.params);
  next();
};

interface SpotifyData {
  spotifyId?: string;
  displayName?: string;
  email?: string;
  images?: { url: string }[];
  topArtists?: SpotifyApi.ArtistObjectFull[];
  topTracks?: SpotifyApi.TrackObjectFull[];
  currentlyPlaying?:
    | SpotifyApi.TrackObjectFull
    | SpotifyApi.EpisodeObject
    | null;
}

const getSpotifyData = async (accessToken: string): Promise<SpotifyData> => {
  try {
    const spotifyApi = new SpotifyWebApi();
    spotifyApi.setAccessToken(accessToken);

    const [meResponse, topArtistsResponse, topTracksResponse, currentlyPlayingResponse] =
      await Promise.all([
        spotifyApi.getMe(),
        spotifyApi.getMyTopArtists(),
        spotifyApi.getMyTopTracks(),
        spotifyApi.getMyCurrentPlayingTrack(),
      ]);

    return {
      spotifyId: meResponse.body.id,
      displayName: meResponse.body.display_name,
      email: meResponse.body.email,
      images: meResponse.body.images,
      topArtists: topArtistsResponse.body.items,
      topTracks: topTracksResponse.body.items,
      currentlyPlaying: currentlyPlayingResponse.body.item,
    };
  } catch (error) {
    console.error('Error fetching Spotify data:', error);
    throw error;
  }
};

router.get(
  '/',
  ensureAuthenticated,
  profileRateLimiter,
  sanitizeInput,
  async (req: Request, res: Response) => {
    if (!req.session || !req.session.access_token) {
      return res.redirect('/auth/login');
    }

    try {
      const spotifyData = await getSpotifyData(
        req.session.access_token as string
      );

      // Sanitize Spotify data
      const sanitizedSpotifyData = {
        spotifyId: sanitizeHtml(spotifyData.spotifyId || ''),
        displayName: sanitizeHtml(spotifyData.displayName || ''),
        email: sanitizeHtml(spotifyData.email || ''),
        images: spotifyData.images || [],
        topArtists: spotifyData.topArtists || [],
        topTracks: spotifyData.topTracks || [],
        currentlyPlaying: spotifyData.currentlyPlaying || null,
      };

      let user = await User.findOne(
        { spotifyId: sanitizedSpotifyData.spotifyId },
        null,
        { sanitizeFilter: true }
      );

      if (!user) {
        user = new User({
          spotifyId: sanitizedSpotifyData.spotifyId,
          displayName: sanitizedSpotifyData.displayName,
          email: sanitizedSpotifyData.email,
          images: sanitizedSpotifyData.images,
          topArtists: sanitizedSpotifyData.topArtists.map((artist) => ({
            name: sanitizeHtml(artist.name),
            external_urls: Object.fromEntries(Object.entries(artist.external_urls)),
            images: artist.images.map((image) => ({ url: image.url })),
          })),
          topTracks: sanitizedSpotifyData.topTracks.map((track) => ({
            name: sanitizeHtml(track.name),
            album: track.album,
            external_urls: Object.fromEntries(Object.entries(track.external_urls)),
          })),
          currentlyPlaying: sanitizedSpotifyData.currentlyPlaying,
        });
      } else {
        user.displayName = sanitizedSpotifyData.displayName || user.displayName;
        user.email = sanitizedSpotifyData.email || user.email;
        user.images = sanitizedSpotifyData.images || user.images;
        user.topArtists =
          sanitizedSpotifyData.topArtists.map((artist) => ({
            name: sanitizeHtml(artist.name),
            external_urls: Object.fromEntries(Object.entries(artist.external_urls)),
            images: artist.images.map((image) => ({ url: image.url })),
          })) || user.topArtists;
        user.topTracks =
          sanitizedSpotifyData.topTracks.map((track) => ({
            name: sanitizeHtml(track.name),
            album: track.album,
            external_urls: Object.fromEntries(Object.entries(track.external_urls)),
          })) || user.topTracks;
        user.currentlyPlaying =
          sanitizedSpotifyData.currentlyPlaying || user.currentlyPlaying;
      }

      await user.save();

      // Generate CSRF token and set it as a cookie
      const secret = req.session.csrfSecret || csrf.secretSync();
      req.session.csrfSecret = secret;
      res.cookie('XSRF-TOKEN', csrf.create(secret), {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false,
        sameSite: 'strict',
      });

      res.json(user);
    } catch (error) {
      console.error('Failed to fetch or save profile data:', error);
      res.status(500).send('Internal Server Error');
    }
  }
);

router.post(
  '/create',
  ensureAuthenticated,
  profileRateLimiter,
  verifyCsrfToken,
  sanitizeInput,
  [
    check('user').isMongoId().withMessage('Invalid user ID').trim(),
    check('bio')
      .isString()
      .withMessage('Bio must be a string')
      .isLength({ min: 10 })
      .withMessage('Bio must be at least 10 characters')
      .trim(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    // Handle Validation Errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { user, bio } = req.body;

    try {
      // Sanitize inputs
      const sanitizedUser = sanitizeHtml(user);
      const sanitizedBio = sanitizeHtml(bio);

      let profile = await Profile.findOne(
        { user: sanitizedUser },
        null,
        { sanitizeFilter: true }
      );

      if (profile) {
        profile.bio = sanitizedBio;
        await profile.save();
        res.json(profile);
        return;
      }

      const newProfile = new Profile({ user: sanitizedUser, bio: sanitizedBio });
      profile = await newProfile.save();
      res.json(profile);
    } catch (err) {
      console.error('Failed to create or update profile:', err);
      res.status(500).send('Server Error');
    }
  }
);

export default router;
