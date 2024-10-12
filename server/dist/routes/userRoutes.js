import express from 'express';
import { check, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import ensureAuthenticated from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';
import csrfTokens from 'csrf';
const router = express.Router();
const csrf = new csrfTokens();
const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many registration attempts from this IP, please try again after 15 minutes',
    headers: true,
});
router.post('/register', registerLimiter, [
    check('username')
        .isAlphanumeric()
        .withMessage('Username must be alphanumeric')
        .trim()
        .escape(),
    check('email')
        .isEmail()
        .withMessage('Invalid email address')
        .normalizeEmail(),
    check('password')
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
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { username, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            res.status(400).json({ error: 'User already exists' });
            return;
        }
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        user = new User({
            username,
            email,
            password: hashedPassword,
        });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    }
    catch (err) {
        console.error('User registration error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/profile', ensureAuthenticated, [
    check('fullName')
        .isString()
        .withMessage('Full name must be a string')
        .trim()
        .escape(),
    check('bio').isString().withMessage('Bio must be a string').trim().escape(),
    check('evaluatedCharacteristics')
        .isArray()
        .withMessage('Evaluated characteristics must be an array')
        .custom((arr) => arr.every((item) => typeof item === 'string'))
        .withMessage('Each evaluated characteristic must be a string'),
    check('musicPreferences')
        .isArray()
        .withMessage('Music preferences must be an array')
        .custom((arr) => arr.every((item) => typeof item === 'string')),
    check('favoriteMovies')
        .isArray()
        .withMessage('Favorite movies must be an array')
        .custom((arr) => arr.every((item) => typeof item === 'string'))
        .withMessage('Each favorite movie must be a string'),
], (req, res, next) => {
    const csrfToken = req.header('X-XSRF-TOKEN');
    const csrfSecret = req.session.csrfSecret;
    if (!csrfSecret || !csrfToken || !csrf.verify(csrfSecret, csrfToken)) {
        res.status(403).json({ error: 'Invalid CSRF token' });
    }
    else {
        next();
    }
}, async (req, res) => {
    const authReq = req;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
    }
    const { fullName, bio, evaluatedCharacteristics, musicPreferences, favoriteMovies, } = req.body;
    try {
        const user = await User.findById(authReq.user._id);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const profile = await Profile.findOneAndUpdate({ user: authReq.user._id }, {
            fullName,
            bio,
            evaluatedCharacteristics,
            musicPreferences,
            favoriteMovies,
        }, { new: true, upsert: true, runValidators: true });
        res.json(profile);
    }
    catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});
router.get('/profile', ensureAuthenticated, async (req, res) => {
    try {
        const authReq = req;
        const profile = await Profile.findOne({
            user: authReq.user._id,
        }).populate('user', '-password -__v');
        if (profile) {
            res.json(profile);
        }
        else {
            res.status(404).json({ error: 'Profile not found' });
        }
    }
    catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});
router.delete('/profile', ensureAuthenticated, async (req, res) => {
    const authReq = req;
    try {
        await Profile.findOneAndDelete({ user: authReq.user._id });
        res.json({ message: 'Profile deleted successfully' });
    }
    catch (err) {
        console.error('Error deleting profile:', err);
        res.status(500).json({ error: 'Failed to delete profile' });
    }
});
export default router;
