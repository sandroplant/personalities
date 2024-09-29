// server/profileController.ts

import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v2 as cloudinary } from 'cloudinary';
import Profile from '../models/Profile';
import multer from 'multer';
import path from 'path';

// Configure Cloudinary using environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
    api_key: process.env.CLOUDINARY_API_KEY as string,
    api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads/'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    },
});

const upload = multer({ storage: storage });

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
        } catch (err) {
            console.error('Error uploading profile picture:', err);
            res.status(500).json({ error: 'Failed to upload profile picture' });
        }
    }
];

// Update Profile
export const updateProfile = [
    body('userId')
        .isMongoId()
        .withMessage('Invalid user ID')
        .trim()
        .escape(),
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
                { new: true }
            );
            if (profile) {
                res.status(200).json(profile);
            } else {
                res.status(404).json({ error: 'Profile not found' });
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            res.status(500).json({ error: 'Failed to update profile' });
        }
    }
];
