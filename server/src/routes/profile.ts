// server/routes/profile.ts

import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { body, validationResult } from 'express-validator';
import SpotifyWebApi from 'spotify-web-api-node';
import User from '../models/User';
import Profile from '../models/Profile';

const router = express.Router();

// Define express-rate-limit middleware
const profileLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message:
        'Too many requests from this IP, please try again after 15 minutes',
    headers: true,
});

// Define rate-limiter-flexible middleware
const profileRateLimiter = new RateLimiterMemory({
    points: 50, // Number of points
    duration: 15 * 60, // Per 15 minutes
});

// Middleware for rate-limiter-flexible
const advancedProfileLimiter = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await profileRateLimiter.consume(req.ip);
        next();
    } catch (err) {
        res.status(429).send(
            'Too many profile requests from this IP, please try again after 15 minutes'
        );
    }
};

// Apply express-rate-limit to all profile routes
router.use(profileLimiter);

/**
 * Utility Function: Fetch Spotify Data
 * Consolidated from utils/profile.ts
 */
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

const getSpotifyData = async (accessToken: string) => {
    try {
        const headers = {
            Authorization: `Bearer ${accessToken}`,
        };

        const [topArtistsResponse, topTracksResponse, currentlyPlayingResponse] = await Promise.all([
            SpotifyWebApi.prototype.get.bind(null, `${SPOTIFY_API_URL}/me/top/artists`)(),
            SpotifyWebApi.prototype.get.bind(null, `${SPOTIFY_API_URL}/me/top/tracks`)(),
            SpotifyWebApi.prototype.get.bind(null, `${SPOTIFY_API_URL}/me/player/currently-playing`)(),
        ]);

        return {
            topArtists: Array.isArray(topArtistsResponse.body.items) ? topArtistsResponse.body.items : [],
            topTracks: Array.isArray(topTracksResponse.body.items) ? topTracksResponse.body.items : [],
            currentlyPlaying: currentlyPlayingResponse.body.item || null,
        };
    } catch (error: any) {
        console.error('Error fetching Spotify data:', error);
        throw error;
    }
};

// GET /profile - Fetch user profile with advanced rate limiting and validation
router.get('/', advancedProfileLimiter, async (req: Request, res: Response) => {
    if (!req.session || !req.session.access_token) {
        return res.redirect('/auth/login');
    }

    const spotifyApi = new SpotifyWebApi();
    spotifyApi.setAccessToken(req.session.access_token as string);

    try {
        const [userData, topArtistsData, topTracksData, currentlyPlayingData] = await Promise.all([
            spotifyApi.getMe(),
            spotifyApi.getMyTopArtists(),
            spotifyApi.getMyTopTracks(),
            spotifyApi.getMyCurrentPlayingTrack(),
        ]);

        const profileData = {
            spotifyId: userData.body.id,
            displayName: userData.body.display_name,
            email: userData.body.email,
            images: userData.body.images,
            topArtists: topArtistsData.body.items,
            topTracks: topTracksData.body.items,
            currentlyPlaying: currentlyPlayingData.body.item,
        };

        let user = await User.findOne({ spotifyId: profileData.spotifyId });

        if (!user) {
            user = new User(profileData);
        } else {
            user.displayName = profileData.displayName;
            user.email = profileData.email;
            user.images = profileData.images;
            user.topArtists = profileData.topArtists;
            user.topTracks = profileData.topTracks;
            user.currentlyPlaying = profileData.currentlyPlaying;
        }

        await user.save();
        res.json(user); // Return the updated user profile
    } catch (error) {
        console.error('Failed to fetch or save profile data:', error);
        res.status(500).send('Internal Server Error');
    }
});

/**
 * POST /profile/create - Create or update profile with validation and rate limiting
 */
router.post(
    '/create',
    advancedProfileLimiter,
    [
        body('user').isMongoId().withMessage('Invalid user ID').trim().escape(),
        body('bio')
            .isString()
            .withMessage('Bio must be a string')
            .isLength({ min: 10 })
            .withMessage('Bio must be at least 10 characters')
            .trim()
            .escape(),
        // Add more validators as needed
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { user, bio } = req.body;

        try {
            let profile = await Profile.findOne({ user });

            if (profile) {
                // Update existing profile
                profile.bio = bio;
                await profile.save();
                return res.json(profile);
            }

            // Create new profile
            const newProfile = new Profile({ user, bio });
            profile = await newProfile.save();
            res.json(profile);
        } catch (err) {
            console.error('Failed to create or update profile:', err);
            res.status(500).send('Server Error');
        }
    }
);

/**
 * POST /profile/update-profile - Update user profile
 */
router.post(
    '/update-profile',
    advancedProfileLimiter,
    [
        body('userId').isMongoId().withMessage('Invalid user ID').trim().escape(),
        body('bio').optional().isString().withMessage('Bio must be a string').isLength({ min: 10 }).withMessage('Bio must be at least 10 characters').trim().escape(),
        body('location').optional().isString().withMessage('Location must be a string').trim().escape(),
        body('website').optional().isURL().withMessage('Invalid URL').trim().escape(),
        body('profilePicture').optional().isString().withMessage('Profile picture must be a string').trim().escape(),
        body('charitabilityCoefficient').optional().isNumeric().withMessage('Must be a number').trim().escape(),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            userId,
            bio,
            location,
            website,
            profilePicture,
            charitabilityCoefficient,
        } = req.body;

        try {
            const user = await User.findByIdAndUpdate(
                userId,
                {
                    'profile.bio': bio,
                    'profile.location': location,
                    'profile.website': website,
                    'profile.profilePicture': profilePicture,
                    charitabilityCoefficient: charitabilityCoefficient,
                },
                { new: true, runValidators: true }
            );

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.status(200).json(user);
        } catch (error) {
            console.error('Failed to update profile:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
);

/**
 * GET /profile/get-profile/:id - Get user profile by ID
 */
router.get('/get-profile/:id', advancedProfileLimiter, async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id).select(
            'profile charitabilityCoefficient'
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Failed to get profile:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
