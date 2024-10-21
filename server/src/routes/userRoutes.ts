// server/routes/userRoutes.ts

import express, { Request, Response, NextFunction } from 'express';
import { Session } from 'express-session';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import User, { IUser } from '../models/User.js';
import Profile, { IProfile } from '../models/Profile.js';
import ensureAuthenticated from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';
import { verifyCsrfToken } from '../middleware/csrfMiddleware.js';
import mongoSanitize from 'express-mongo-sanitize';
import sanitizeHtml from 'sanitize-html';

const router = express.Router();

// Initialize CSRF Tokens

// Rate Limiting Middleware
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message:
    'Too many registration attempts from this IP, please try again after 15 minutes',
  headers: true,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message:
    'Too many requests from this IP, please try again after 15 minutes',
  headers: true,
});

// Middleware for sanitizing user input
const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  mongoSanitize.sanitize(req.body);
  next();
};
// Extend the Request interface to include the user and session properties
interface AuthenticatedRequest extends Request {
  user: {
    _id: string;
    id: string;
  };
  session: Session & { userId?: string };
}

// ==========================
// User Registration Route
// ==========================

router.post(
  '/register',
  registerLimiter,
  sanitizeInput,
  [
    body('username')
      .isAlphanumeric()
      .withMessage('Username must be alphanumeric')
      .trim(),
    body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
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
  async (
    req: Request<Record<string, unknown>, unknown, { username: string; email: string; password: string }>,
    res: Response
  ): Promise<void> => {
    // Handle Validation Errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { username, email, password } = req.body;

    try {
      // Sanitize inputs
      const sanitizedUsername = sanitizeHtml(username);
      const sanitizedEmail = sanitizeHtml(email);

      // Check if user already exists
      let user: IUser | null = await User.findOne(
        { email: sanitizedEmail },
        null,
        { sanitizeFilter: true }
      );
      if (user) {
        res.status(400).json({ error: 'User already exists' });
        return;
      }

      // Hash Password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create New User
      user = new User({
        username: sanitizedUsername,
        email: sanitizedEmail,
        password: hashedPassword,
      });

      await user.save();

      res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
      console.error('User registration error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ==========================
// User Login Route
// ==========================

router.post(
  '/login',
  sanitizeInput,
  [
    body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required').trim(),
  ],
  async (
    req: Request<Record<string, unknown>, unknown, { email: string; password: string }>,
    res: Response
  ): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    try {
      // Sanitize inputs
      const sanitizedEmail = sanitizeHtml(email);

      const user: IUser | null = await User.findOne(
        { email: sanitizedEmail },
        null,
        { sanitizeFilter: true }
      );
      if (!user) {
        res.status(400).json({ error: 'Invalid credentials' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(400).json({ error: 'Invalid credentials' });
        return;
      }

      // Implement session creation logic here
      // For example, setting user ID in session
      req.session.userId = (user._id as string).toString();

      res.json({ message: 'Login successful' });
    } catch (err) {
      console.error('User login error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ==========================
// Create or Update User Profile
// ==========================

router.post(
  '/profile',
  ensureAuthenticated,
  apiLimiter,
  verifyCsrfToken,
  sanitizeInput,
  [
    body('fullName')
      .isString()
      .withMessage('Full name must be a string')
      .trim(),
    body('bio')
      .isString()
      .withMessage('Bio must be a string')
      .trim(),
    body('evaluatedCharacteristics')
      .isArray()
      .withMessage('Evaluated characteristics must be an array')
      .custom((arr: string[]) => arr.every((item) => typeof item === 'string'))
      .withMessage('Each evaluated characteristic must be a string'),
    body('musicPreferences')
      .isArray()
      .withMessage('Music preferences must be an array')
      .custom((arr: string[]) => arr.every((item) => typeof item === 'string')),
    body('favoriteMovies')
      .isArray()
      .withMessage('Favorite movies must be an array')
      .custom((arr: string[]) => arr.every((item) => typeof item === 'string'))
      .withMessage('Each favorite movie must be a string'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    // Handle Validation Errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const {
      fullName,
      bio,
      evaluatedCharacteristics,
      musicPreferences,
      favoriteMovies,
    } = req.body;

    try {
      // Sanitize inputs
      const sanitizedFullName = sanitizeHtml(fullName);
      const sanitizedBio = sanitizeHtml(bio);
      const sanitizedEvaluatedCharacteristics = evaluatedCharacteristics.map(
        (item: string) => sanitizeHtml(item)
      );
      const sanitizedMusicPreferences = musicPreferences.map((item: string) =>
        sanitizeHtml(item)
      );
      const sanitizedFavoriteMovies = favoriteMovies.map((item: string) =>
        sanitizeHtml(item)
      );

      const user: IUser | null = await User.findById(
        authReq.user._id,
        null,
        { sanitizeFilter: true }
      );
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Create or Update Profile Securely
      const profileData = {
        user: authReq.user._id,
        fullName: sanitizedFullName,
        bio: sanitizedBio,
        evaluatedCharacteristics: sanitizedEvaluatedCharacteristics,
        musicPreferences: sanitizedMusicPreferences,
        favoriteMovies: sanitizedFavoriteMovies,
      };

      const profile: IProfile | null = await Profile.findOneAndUpdate(
        { user: authReq.user._id },
        profileData,
        { new: true, upsert: true, runValidators: true, sanitizeFilter: true }
      );

      res.json(profile);
    } catch (err) {
      console.error('Error updating profile:', err);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// ==========================
// Get User Profile
// ==========================

router.get(
  '/profile',
  ensureAuthenticated,
  apiLimiter,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const profile: IProfile | null = await Profile.findOne(
        { user: authReq.user._id },
        null,
        { sanitizeFilter: true }
      ).populate('user', '-password -__v');
      if (profile) {
        res.json(profile);
      } else {
        res.status(404).json({ error: 'Profile not found' });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }
);

// ==========================
// Delete User Profile
// ==========================

router.delete(
  '/profile',
  ensureAuthenticated,
  apiLimiter,
  verifyCsrfToken,
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    try {
      await Profile.findOneAndDelete(
        { user: authReq.user._id },
        { sanitizeFilter: true }
      );
      res.json({ message: 'Profile deleted successfully' });
    } catch (err) {
      console.error('Error deleting profile:', err);
      res.status(500).json({ error: 'Failed to delete profile' });
    }
  }
);

export default router;
