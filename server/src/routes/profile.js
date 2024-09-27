import express from 'express';
import rateLimit from 'express-rate-limit';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { body, validationResult } from 'express-validator';
import SpotifyWebApi from 'spotify-web-api-node';
import User from '../models/User.js';
import Profile from '../models/Profile.js';

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
const advancedProfileLimiter = (req, res, next) => {
    profileRateLimiter
        .consume(req.ip)
        .then(() => {
            next();
        })
        .catch(() => {
            res.status(429).send(
                'Too many profile requests from this IP, please try again after 15 minutes'
            );
        });
};

// Apply express-rate-limit to all profile routes
router.use(profileLimiter);

// GET /profile - Fetch user profile with advanced rate limiting and validation
router.get('/', advancedProfileLimiter, async (req, res) => {
    if (!req.session || !req.session.access_token) {
        return res.redirect('/auth/login');
    }

    const spotifyApi = new SpotifyWebApi();
    spotifyApi.setAccessToken(req.session.access_token);

    try {
        const [userData, topArtistsData, topTracksData, currentlyPlayingData] =
            await Promise.all([
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

// Example POST /profile/create with validation and rate limiting
router.post(
    '/create',
    advancedProfileLimiter,
    [
        body('user').isMongoId().withMessage('Invalid user ID').trim().escape(),
        body('bio')
            .isLength({ min: 10 })
            .withMessage('Bio must be at least 10 characters')
            .trim()
            .escape(),
        // Add more validators as needed
    ],
    async (req, res) => {
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

export default router;
