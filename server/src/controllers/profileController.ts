import { __dirname } from '../utils/pathUtil.js';
import path from 'path';
import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v2 as cloudinary } from 'cloudinary';
import Profile from '../models/Profile.js';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import { verifyCsrfToken } from '../middleware/csrfMiddleware.js';
import '../config/env.js';

// Configure Cloudinary using environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, path.join(__dirname, '../../uploads/'));
    },
    filename: function (_req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    },
});

const upload = multer({ storage: storage });

// Rate Limiting Middleware
const profileRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per windowMs
    message:
        'Too many profile requests from this IP, please try again after 15 minutes',
});

// Upload Profile Picture
export const uploadProfilePicture = [
    upload.single('profilePicture'),
    async (req: Request, res: Response) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        try {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'profile_pictures',
            });
            res.status(200).json({ url: result.secure_url });
        } catch (error) {
            console.error('Cloudinary Upload Error:', error);
            res.status(500).json({ error: 'Failed to upload profile picture' });
        }
    },
];

// Update Profile
export const updateProfile = [
    profileRateLimiter,
    verifyCsrfToken,
    body('userId').isMongoId().withMessage('Invalid user ID').trim().escape(),
    body('profileData')
        .isObject()
        .withMessage('Profile data must be an object'),
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { userId, profileData } = req.body;

        try {
            const profile = await Profile.findOneAndUpdate(
                { user: userId },
                profileData,
                { new: true, runValidators: true }
            );
            if (profile) {
                res.status(200).json(profile);
            } else {
                res.status(404).json({ error: 'Profile not found' });
            }
        } catch (error) {
            console.error('Profile Update Error:', error);
            res.status(500).json({ error: 'Failed to update profile' });
        }
    },
];
