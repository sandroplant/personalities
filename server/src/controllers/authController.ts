// server/src/controllers/authController.ts

import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Removed unused 'IUser' import
import { rateLimit } from 'express-rate-limit';
import Post from '../models/Post.js';
import { verifyCsrfToken } from '../middleware/verifyCsrfToken.js';
import mongoose from 'mongoose';
import sanitize from 'mongo-sanitize'; // Import mongo-sanitize
import '../config/env.js';

const { JWT_SECRET } = process.env;

// Rate Limiting Middleware
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per windowMs
    message:
        'Too many authentication requests from this IP, please try again after 15 minutes',
});

// Define interfaces for request bodies

interface RegisterBody {
    username: string;
    password: string;
}

interface LoginBody {
    username: string;
    password: string;
}

interface CreatePostBody {
    title: string;
    content: string;
    author: string;
}

// Helper function to safely handle errors
const handleError = (res: Response, message: string, error: unknown) => {
    if (error instanceof Error) {
        console.error(message, error.message);
    } else {
        console.error(message, error);
    }
    res.status(500).json({ message });
};

// Register a new user
export const register = [
    authRateLimiter,
    verifyCsrfToken,
    body('username')
        .isString()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters long')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage(
            'Username can only contain letters, numbers, underscores, and dashes'
        ),
    body('password')
        .isString()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .trim(),
    // Define the request handler with specific body type
    async (
        req: Request<Record<string, never>, unknown, RegisterBody>,
        res: Response
    ) => {
        // Validate request data
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { username, password } = req.body;

            // Ensure username is a string
            if (typeof username !== 'string') {
                return res
                    .status(400)
                    .json({ message: 'Invalid username format' });
            }

            // Sanitize username to prevent NoSQL injection
            const sanitizedUsername = sanitize(username);

            // Check if user exists
            const existingUser = await User.findOne({
                username: sanitizedUsername,
            }).exec();

            if (existingUser) {
                return res
                    .status(409)
                    .json({ message: 'Username already exists' });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new user
            const newUser = new User({
                username: sanitizedUsername,
                password: hashedPassword,
            });
            await newUser.save();

            res.status(201).send('User registered');
        } catch (error: unknown) {
            handleError(res, 'Error registering user', error);
        }
    },
];

// Login a user
export const login = [
    authRateLimiter,
    verifyCsrfToken,
    body('username')
        .isString()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters long')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage(
            'Username can only contain letters, numbers, underscores, and dashes'
        ),
    body('password')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Password is required'),
    // Define the request handler with specific body type
    async (
        req: Request<Record<string, never>, unknown, LoginBody>,
        res: Response
    ) => {
        // Validate request data
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { username, password } = req.body;

            // Ensure username is a string
            if (typeof username !== 'string') {
                return res
                    .status(400)
                    .json({ message: 'Invalid username format' });
            }

            // Sanitize username to prevent NoSQL injection
            const sanitizedUsername = sanitize(username);

            // Find user
            const user = await User.findOne({
                username: sanitizedUsername,
            }).exec();

            if (user && (await bcrypt.compare(password, user.password))) {
                if (!JWT_SECRET) {
                    return res
                        .status(500)
                        .json({ message: 'JWT secret not configured' });
                }
                const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
                    expiresIn: '1h',
                });
                res.status(200).json({ message: 'User logged in', token });
            } else {
                res.status(401).json({ message: 'Invalid credentials' });
            }
        } catch (error: unknown) {
            handleError(res, 'Error logging in', error);
        }
    },
];

// Create a new post
export const createPost = [
    authRateLimiter,
    verifyCsrfToken,
    body('title').isString().trim().notEmpty().withMessage('Title is required'),
    body('content')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Content is required'),
    body('author')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Author ID is required'),
    // Define the request handler with specific body type
    async (
        req: Request<Record<string, never>, unknown, CreatePostBody>,
        res: Response
    ) => {
        // Validate request data
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { title, content, author } = req.body;

            // Validate and cast the author ID
            if (!mongoose.Types.ObjectId.isValid(author)) {
                return res
                    .status(400)
                    .json({ message: 'Invalid author ID format' });
            }
            const authorId = new mongoose.Types.ObjectId(author);

            // Sanitize title and content
            const sanitizedTitle = sanitize(title);
            const sanitizedContent = sanitize(content);

            // Check if author exists
            const authorExists = await User.findById(authorId).exec();
            if (!authorExists) {
                return res.status(404).json({ message: 'Author not found' });
            }

            // Create a new post
            const newPost = new Post({
                title: sanitizedTitle,
                content: sanitizedContent,
                author: authorId,
            });
            await newPost.save();

            res.status(201).json({ message: 'Post created' });
        } catch (error: unknown) {
            handleError(res, 'Error creating post', error);
        }
    },
];
