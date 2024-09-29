import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Post from '../models/Post.js';

const { JWT_SECRET } = process.env;

// Register a new user
export const register = [
    body('username').isString().trim().escape().withMessage('Username is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long').trim().escape(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { username, password } = req.body;
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({ username, password: hashedPassword });
            await newUser.save();
            res.status(201).send('User registered');
        } catch (error) {
            console.error('Error registering user:', error);
            res.status(500).send('Error registering user');
        }
    }
];

// Login a user
export const login = [
    body('username').isString().trim().escape().withMessage('Username is required'),
    body('password').isString().trim().escape().withMessage('Password is required'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { username, password } = req.body;
            const user = await User.findOne({ username });
            if (user && await bcrypt.compare(password, user.password)) {
                const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
                res.status(200).json({ message: 'User logged in', token });
            } else {
                res.status(401).send('Invalid credentials');
            }
        } catch (error) {
            console.error('Error logging in:', error);
            res.status(500).send('Error logging in');
        }
    }
];

// Create a new post
export const createPost = [
    body('title').isString().trim().escape().withMessage('Title is required'),
    body('content').isString().trim().escape().withMessage('Content is required'),
    body('author').isMongoId().withMessage('Invalid author ID').trim().escape(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { title, content, author } = req.body;
            const newPost = new Post({ title, content, author });
            await newPost.save();
            res.status(201).send('Post created');
        } catch (error) {
            console.error('Error creating post:', error);
            res.status(500).send('Error creating post');
        }
    }
];