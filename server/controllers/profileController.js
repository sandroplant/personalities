import { v2 as cloudinary } from 'cloudinary';
import { body, validationResult } from 'express-validator';
import Profile from '../models/Profile.js';

// Configure Cloudinary using environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload Profile Picture
export const uploadProfilePicture = async (req, res) => {
    try {
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'profile_pictures',
        });
        res.status(200).json({ url: result.secure_url });
    } catch (err) {
        console.error('Error uploading profile picture:', err);
        res.status(500).json({ error: 'Failed to upload profile picture' });
    }
};

// Update Profile
export const updateProfile = [
    body('userId').isMongoId().withMessage('Invalid user ID').trim().escape(),
    body('profileData').isObject().withMessage('Profile data must be an object'),
    async (req, res) => {
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