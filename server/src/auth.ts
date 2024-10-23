import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import User from './models/User.js';
import mongoSanitize from 'express-mongo-sanitize'; // Import express-mongo-sanitize

// Extend the Session interface to include user property
declare module 'express-session' {
    interface Session {
        user?: string;
    }
}

const router = express.Router();

// Use express-mongo-sanitize middleware
router.use(mongoSanitize());

// Input validation and sanitization for login
const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Invalid email address')
        .normalizeEmail()
        .trim(),
    body('password')
        .isString()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .trim(),
];

// Input validation and sanitization for registration
const validateRegister = [
    body('email')
        .isEmail()
        .withMessage('Invalid email address')
        .normalizeEmail()
        .trim(),
    body('password')
        .isString()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .trim(),
    body('name')
        .isString()
        .not()
        .isEmpty()
        .withMessage('Name is required')
        .trim()
        .escape(),
];

// Example login route
router.post(
    '/login',
    validateLogin,
    async (req: Request, res: Response): Promise<void> => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { email, password } = req.body;

        try {
            // Ensure email is a string
            if (typeof email !== 'string') {
                res.status(400).json({ message: 'Invalid email format' });
                return;
            }

            // Use Mongoose's sanitizeFilter option to sanitize the query
            const user = await User.findOne({ email }, null, {
                sanitizeFilter: true,
            }).exec();
            if (!user) {
                res.status(401).json({ message: 'Invalid email or password' });
                return;
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                res.status(401).json({ message: 'Invalid email or password' });
                return;
            }

            // Set user information in session
            req.session.user = user.id;

            res.send('Login successful');
        } catch (error) {
            console.error('Error during login:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// Example registration route
router.post(
    '/register',
    validateRegister,
    async (req: Request, res: Response): Promise<void> => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { email, password, name } = req.body;

        try {
            // Ensure email is a string
            if (typeof email !== 'string') {
                res.status(400).json({ message: 'Invalid email format' });
                return;
            }

            // Use Mongoose's sanitizeFilter option to sanitize the query
            const existingUser = await User.findOne({ email }, null, {
                sanitizeFilter: true,
            }).exec();
            if (existingUser) {
                res.status(409).json({ message: 'Email already in use' });
                return;
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = new User({
                email,
                password: hashedPassword,
                name,
            });

            await newUser.save();

            // Set user information in session
            req.session.user = newUser.id;

            res.send('Registration successful');
        } catch (error) {
            console.error('Error during registration:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

export default router;
