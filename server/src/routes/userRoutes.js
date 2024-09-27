import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import ensureAuthenticated from '../middleware/authMiddleware.js';

const router = express.Router();

// Create or update user profile
router.post(
    '/profile',
    ensureAuthenticated,
    [
        body('fullName').isString().trim().escape(),
        body('bio').isString().trim().escape(),
        body('evaluatedCharacteristics').isArray(),
        body('musicPreferences').isArray(),
        body('favoriteMovies').isArray(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            fullName,
            bio,
            evaluatedCharacteristics,
            musicPreferences,
            favoriteMovies,
        } = req.body;
        try {
            const user = await User.findById(req.user._id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            let profile = await Profile.findOneAndUpdate(
                { user: req.user._id },
                {
                    fullName,
                    bio,
                    evaluatedCharacteristics,
                    musicPreferences,
                    favoriteMovies,
                },
                { new: true, upsert: true }
            );

            res.json(profile);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to update profile' });
        }
    }
);

// Get user profile
router.get('/profile', ensureAuthenticated, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user._id }).populate(
            'user'
        );
        if (profile) {
            res.json(profile);
        } else {
            res.status(404).json({ error: 'Profile not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Delete user profile
router.delete('/profile', ensureAuthenticated, async (req, res) => {
    try {
        await Profile.findOneAndDelete({ user: req.user._id });
        res.json({ message: 'Profile deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete profile' });
    }
});

export default router;