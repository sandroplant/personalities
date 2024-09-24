const cloudinary = require('cloudinary').v2;
const Profile = require('../models/Profile');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload Profile Picture
exports.uploadProfilePicture = async (req, res) => {
    try {
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'profile_pictures'
        });
        res.status(200).json({ url: result.secure_url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update Profile
exports.updateProfile = async (req, res) => {
    const { userId, profileData } = req.body;
    try {
        const profile = await Profile.findOneAndUpdate(
            { userId },
            profileData,
            { new: true }
        );
        res.status(200).json(profile);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
