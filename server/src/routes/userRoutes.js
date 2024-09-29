// src/routes/userRoutes.js

import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt'; // For hashing passwords
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import ensureAuthenticated from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// ==========================
// Rate Limiting Middleware
// ==========================

// Apply stricter rate limits on sensitive routes like registration to prevent brute-force attacks
const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 registration requests per windowMs
    message: 'Too many registration attempts from this IP, please try again after 15 minutes',
    headers: true,
});

// ==========================
// User Registration Route
// ==========================

/**
 * @route   POST /user/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
    '/register',
    registerLimiter, // Apply rate limiting to this route
    [
        // Input Validation and Sanitization
        body('username')
            .isAlphanumeric()
            .withMessage('Username must be alphanumeric')
            .trim()
            .escape(),
        body('email')
            .isEmail()
            .withMessage('Invalid email address')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/[a-z]/)
            .withMessage('Password must contain at least one lowercase letter')
            .matches(/[A-Z]/)
            .withMessage('Password must contain at least one uppercase letter')
            .matches(/[0-9]/)
            .withMessage('Password must contain at least one number')
            .matches(/[\W]/)
            .withMessage('Password must contain at least one special character')
            .trim(),
    ],
    async (req, res) => {
        // Handle Validation Errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password } = req.body;

        try {
            // Check if user already exists to prevent Duplicate Accounts
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ error: 'User already exists' });
            }

            // Hash Password to Prevent Clear Text Storage of Sensitive Information (8)
            const saltRounds = 12; // Adjust salt rounds as needed for security/performance balance
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Create New User with Hashed Password
            user = new User({
                username,
                email,
                password: hashedPassword,
            });

            await user.save();

            res.status(201).json({ message: 'User registered successfully' });
        } catch (err) {
            console.error('User registration error:', err); // 9. Clear-Text Logging of Sensitive Information
            res.status(500).json({ error: 'Server error' }); // Generic error message to prevent information leakage
        }
    }
);

// ==========================
// Create or Update User Profile
// ==========================

/**
 * @route   POST /user/profile
 * @desc    Create or update user profile
 * @access  Private
 */
router.post(
    '/profile',
    ensureAuthenticated,
    [
        // Input Validation and Sanitization
        body('fullName')
            .isString()
            .withMessage('Full name must be a string')
            .trim()
            .escape(),
        body('bio')
            .isString()
            .withMessage('Bio must be a string')
            .trim()
            .escape(),
        body('evaluatedCharacteristics')
            .isArray()
            .withMessage('Evaluated characteristics must be an array')
            .custom((arr) => arr.every(item => typeof item === 'string'))
            .withMessage('Each evaluated characteristic must be a string'),
        body('musicPreferences')
            .isArray()
            .withMessage('Music preferences must be an array')
            .custom((arr) => arr.every(item => typeof item === 'string'))
            .withMessage('Each music preference must be a string'),
        body('favoriteMovies')
            .isArray()
            .withMessage('Favorite movies must be an array')
            .custom((arr) => arr.every(item => typeof item === 'string'))
            .withMessage('Each favorite movie must be a string'),
    ],
    async (req, res) => {
        // Handle Validation Errors
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
            // Ensure User Exists
            const user = await User.findById(req.user._id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Create or Update Profile Securely
            const profile = await Profile.findOneAndUpdate(
                { user: req.user._id },
                {
                    fullName,
                    bio,
                    evaluatedCharacteristics,
                    musicPreferences,
                    favoriteMovies,
                },
                { new: true, upsert: true, runValidators: true } // runValidators ensures data integrity
            );

            res.json(profile);
        } catch (err) {
            console.error('Error updating profile:', err); // 9. Clear-Text Logging of Sensitive Information
            res.status(500).json({ error: 'Failed to update profile' }); // Generic error message
        }
    }
);

// ==========================
// Get User Profile
// ==========================

/**
 * @route   GET /user/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', ensureAuthenticated, async (req, res) => {
    try {
        // Retrieve Profile and Populate User Information
        const profile = await Profile.findOne({ user: req.user._id }).populate('user', '-password -__v');
        if (profile) {
            res.json(profile);
        } else {
            res.status(404).json({ error: 'Profile not found' });
        }
    } catch (err) {
        console.error('Error fetching profile:', err); // 9. Clear-Text Logging of Sensitive Information
        res.status(500).json({ error: 'Failed to fetch profile' }); // Generic error message
    }
});

// ==========================
// Delete User Profile
// ==========================

/**
 * @route   DELETE /user/profile
 * @desc    Delete user profile
 * @access  Private
 */
router.delete('/profile', ensureAuthenticated, async (req, res) => {
    try {
        // Delete Profile Securely
        await Profile.findOneAndDelete({ user: req.user._id });
        res.json({ message: 'Profile deleted successfully' });
    } catch (err) {
        console.error('Error deleting profile:', err); // 9. Clear-Text Logging of Sensitive Information
        res.status(500).json({ error: 'Failed to delete profile' }); // Generic error message
    }
});

export default router;
