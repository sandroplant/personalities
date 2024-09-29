// server/auth.ts

import express, { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator/check';
import { validationResult } from 'express-validator/check';
import bcrypt from 'bcrypt';
import User from './src/models/User'; // Updated import path without .js
import { Session } from 'express-session';

// Extend the Session interface to include user property
declare module 'express-session' {
    interface Session {
        user?: string; // You can expand this based on your needs
    }
}

const router = express.Router();

// Define an interface for session to include user information
declare module 'express-session' {
    interface SessionData {
        user?: string; // You can expand this based on your needs
    }
}

// Input validation and sanitization for login
const validateLogin = [
    body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .trim()
        .escape(),
];

// Input validation and sanitization for registration
const validateRegister = [
    body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .trim()
        .escape(),
    body('name').not().isEmpty().withMessage('Name is required').trim().escape(),
];

// Example login route
router.post('/login', validateLogin, async (req: Request, res: Response) => {
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

        // Example: Set user information in session
        (req.session as Session).user = user.id;

        res.send('Login successful');
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Example registration route
router.post('/register', validateRegister, async (req: Request, res: Response) => {
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

        // Example: Set user information in session
        (req.session as Session).user = newUser.id;

        res.send('Registration successful');
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
