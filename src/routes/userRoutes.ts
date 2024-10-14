import express, { Request, Response, NextFunction } from 'express';
import { check, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import User, { IUser } from '../models/User.js';
import Profile, { IProfile } from '../models/Profile.js';
import ensureAuthenticated from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';
import csrfTokens from 'csrf'; // Import CSRF Tokens for added security

const router = express.Router();

// Initialize CSRF Tokens
const csrf = new csrfTokens();

// ==========================
// Rate Limiting Middleware
// ==========================

// Apply stricter rate limits on sensitive routes like registration to prevent brute-force attacks
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 registration requests per windowMs
  message:
    'Too many registration attempts from this IP, please try again after 15 minutes',
  headers: true,
});

// Extend the Request interface to include the user property
interface AuthenticatedRequest extends Request {
  user: {
    _id: string;
    id: string;
  };
}

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
      // Check if user already exists to prevent duplicate accounts
      let user: IUser | null = await User.findOne({ email });
      if (user) {
        res.status(400).json({ error: 'User already exists' });
        return;
      }

      // Hash Password to Prevent Clear Text Storage of Sensitive Information
      const saltRounds = 12;
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
      console.error('User registration error:', err);
      res.status(500).json({ error: 'Server error' });
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
    check('fullName')
      .isString()
      .withMessage('Full name must be a string')
      .trim()
      .escape(),
    check('bio').isString().withMessage('Bio must be a string').trim().escape(),
    check('evaluatedCharacteristics')
      .isArray()
      .withMessage('Evaluated characteristics must be an array')
      .custom((arr: string[]) => arr.every((item) => typeof item === 'string'))
      .withMessage('Each evaluated characteristic must be a string'),
    check('musicPreferences')
      .isArray()
      .withMessage('Music preferences must be an array')
      .custom((arr: string[]) => arr.every((item) => typeof item === 'string')),
    check('favoriteMovies')
      .isArray()
      .withMessage('Favorite movies must be an array')
      .custom((arr: string[]) => arr.every((item) => typeof item === 'string'))
      .withMessage('Each favorite movie must be a string'),
  ],
  (req: Request, res: Response, next: NextFunction): void => {
    // CSRF token validation
    const csrfToken = req.header('X-XSRF-TOKEN');
    const csrfSecret = req.session.csrfSecret;

    if (!csrfSecret || !csrfToken || !csrf.verify(csrfSecret, csrfToken)) {
      res.status(403).json({ error: 'Invalid CSRF token' });
    } else {
      next();
    }
  },
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    // Handle Validation Errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    const {
      fullName,
      bio,
      evaluatedCharacteristics,
      musicPreferences,
      favoriteMovies,
    } = req.body;

    try {
      const user: IUser | null = await User.findById(authReq.user._id);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Create or Update Profile Securely
      const profile: IProfile | null = await Profile.findOneAndUpdate(
        { user: authReq.user._id },
        {
          fullName,
          bio,
          evaluatedCharacteristics,
          musicPreferences,
          favoriteMovies,
        },
        { new: true, upsert: true, runValidators: true }
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

/**
 * @route   GET /user/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get(
  '/profile',
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    try {
      // Retrieve Profile and Populate User Information
      const authReq = req as AuthenticatedRequest;
      const profile: IProfile | null = await Profile.findOne({
        user: authReq.user._id,
      }).populate('user', '-password -__v');
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

/**
 * @route   DELETE /user/profile
 * @desc    Delete user profile
 * @access  Private
 */
router.delete(
  '/profile',
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    try {
      // Delete Profile Securely
      await Profile.findOneAndDelete({ user: authReq.user._id });
      res.json({ message: 'Profile deleted successfully' });
    } catch (err) {
      console.error('Error deleting profile:', err);
      res.status(500).json({ error: 'Failed to delete profile' });
    }
  }
);

export default router;