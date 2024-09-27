import { v2 as cloudinary } from 'cloudinary';
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
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Update Profile
export const updateProfile = async (req, res) => {
    const { userId, profileData } = req.body;
    try {
        const profile = await Profile.findOneAndUpdate(
            { userId },
            profileData,
            {
                new: true,
            }
        );
        res.status(200).json(profile);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
};
