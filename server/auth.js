import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import User from './src/models/User.js'; // Assuming you have a User model

const router = express.Router();

// Input validation and sanitization
const validateLogin = [
    body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long').trim().escape(),
];

const validateRegister = [
    body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long').trim().escape(),
    body('name').not().isEmpty().withMessage('Name is required').trim().escape(),
];

// Example login route
router.post('/login', validateLogin, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Authentication logic here (e.g., generate JWT, set session)
        res.send('Login successful');
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Example registration route
router.post('/register', validateRegister, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email,
            password: hashedPassword,
            name,
        });

        await newUser.save();

        // Registration logic here (e.g., send confirmation email)
        res.send('Registration successful');
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;