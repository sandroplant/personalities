import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../src/models/User';
import Post from '../src/models/Post';

const { JWT_SECRET } = process.env;

// Define an interface for JWT payload
interface JwtPayload {
  userId: string;
  role?: string; // Add other fields as necessary
}

// Register a new user
export const register = [
  body('username')
    .isString()
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .trim()
    .escape(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username, password } = req.body;
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(409).json({ message: 'Username already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ username, password: hashedPassword });
      await newUser.save();
      res.status(201).send('User registered');
    } catch {
      res.status(500).send('Error registering user');
    }
  },
];

// Login a user
export const login = [
  body('username')
    .isString()
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .isString()
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Password is required'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });
      if (user && (await bcrypt.compare(password, user.password))) {
        if (!JWT_SECRET) {
          return res.status(500).json({ message: 'JWT secret not configured' });
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
          expiresIn: '1h',
        });
        res.status(200).json({ message: 'User logged in', token });
      } else {
        res.status(401).send('Invalid credentials');
      }
    } catch {
      res.status(500).send('Error logging in');
    }
  },
];

// Create a new post
export const createPost = [
  body('title').isString().trim().escape().withMessage('Title is required'),
  body('content').isString().trim().escape().withMessage('Content is required'),
  body('author').isMongoId().withMessage('Invalid author ID'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, content, author } = req.body;
      const authorExists = await User.findById(author);
      if (!authorExists) {
        return res.status(404).json({ message: 'Author not found' });
      }

      const newPost = new Post({ title, content, author });
      await newPost.save();
      res.status(201).send('Post created');
    } catch {
      res.status(500).send('Error creating post');
    }
  },
];
