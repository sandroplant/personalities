import express from 'express';
import { check, validationResult } from 'express-validator';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import SpotifyWebApi from 'spotify-web-api-node';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import csrfTokens from 'csrf'; // Import CSRF Tokens
const router = express.Router();
// Initialize Rate Limiter to prevent excessive requests
const profileRateLimiter = new RateLimiterMemory({
    points: 50,
    duration: 15 * 60,
});
// Middleware for applying rate limiting
const advancedProfileLimiter = async (req, res, next) => {
    try {
        await profileRateLimiter.consume(req.ip || '127.0.0.1');
        next();
    }
    catch (err) {
        res
            .status(429)
            .send('Too many profile requests from this IP, please try again after 15 minutes');
    }
};
// Initialize CSRF Tokens
const csrf = new csrfTokens();
const getSpotifyData = async (accessToken) => {
    try {
        const spotifyApi = new SpotifyWebApi();
        spotifyApi.setAccessToken(accessToken);
        const [topArtistsResponse, topTracksResponse, currentlyPlayingResponse] = await Promise.all([
            spotifyApi.getMyTopArtists(),
            spotifyApi.getMyTopTracks(),
            spotifyApi.getMyCurrentPlayingTrack(),
        ]);
        return {
            topArtists: topArtistsResponse.body.items,
            topTracks: topTracksResponse.body.items,
            currentlyPlaying: currentlyPlayingResponse.body.item,
        };
    }
    catch (error) {
        console.error('Error fetching Spotify data:', error);
        throw error;
    }
};
router.get('/', advancedProfileLimiter, async (req, res) => {
    if (!req.session || !req.session.access_token) {
        return res.redirect('/auth/login');
    }
    try {
        const spotifyData = await getSpotifyData(req.session.access_token);
        let user = await User.findOne({ spotifyId: spotifyData.spotifyId });
        if (!user) {
            user = new User({
                spotifyId: spotifyData.spotifyId || '',
                displayName: spotifyData.displayName || '',
                email: spotifyData.email || '',
                images: spotifyData.images || [],
                topArtists: spotifyData.topArtists?.map((artist) => ({
                    name: artist.name,
                    external_urls: artist.external_urls,
                    images: artist.images.map((image) => ({ url: image.url })),
                })) || [],
                topTracks: spotifyData.topTracks?.map((track) => ({
                    name: track.name,
                    album: track.album,
                    external_urls: track.external_urls,
                })) || [],
                currentlyPlaying: spotifyData.currentlyPlaying || undefined,
            });
        }
        else {
            user.displayName = spotifyData.displayName || user.displayName;
            user.email = spotifyData.email || user.email;
            user.images = spotifyData.images || user.images;
            user.topArtists =
                spotifyData.topArtists?.map((artist) => ({
                    name: artist.name,
                    external_urls: Object.fromEntries(Object.entries(artist.external_urls)),
                    images: artist.images.map((image) => ({ url: image.url })),
                })) || user.topArtists;
            user.topTracks =
                spotifyData.topTracks?.map((track) => ({
                    name: track.name,
                    album: track.album,
                    external_urls: Object.fromEntries(Object.entries(track.external_urls)),
                })) || user.topTracks;
            user.currentlyPlaying =
                spotifyData.currentlyPlaying || user.currentlyPlaying;
        }
        await user.save();
        // Generate CSRF token and set it as a cookie
        const secret = req.session.csrfSecret || csrf.secretSync();
        req.session.csrfSecret = secret;
        res.cookie('XSRF-TOKEN', csrf.create(secret), {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: false,
            sameSite: 'lax',
        });
        res.json(user);
    }
    catch (error) {
        console.error('Failed to fetch or save profile data:', error);
        res.status(500).send('Internal Server Error');
    }
});
router.post('/create', advancedProfileLimiter, [
    check('user').isMongoId().withMessage('Invalid user ID').trim().escape(),
    check('bio')
        .isString()
        .withMessage('Bio must be a string')
        .isLength({ min: 10 })
        .withMessage('Bio must be at least 10 characters')
        .trim()
        .escape(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { user, bio } = req.body;
    try {
        let profile = await Profile.findOne({ user });
        if (profile) {
            profile.bio = bio;
            await profile.save();
            res.json(profile);
            return;
        }
        const newProfile = new Profile({ user, bio });
        profile = await newProfile.save();
        res.json(profile);
    }
    catch (err) {
        console.error('Failed to create or update profile:', err);
        res.status(500).send('Server Error');
    }
});
export default router;
