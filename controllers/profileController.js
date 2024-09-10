const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });
        if (user) {
            res.status(200).json(user.profile);
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        res.status(500).send('Error fetching profile');
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const { username } = req.params;
        const { bio, location, website } = req.body;
        const user = await User.findOneAndUpdate(
            { username },
            { $set: { 'profile.bio': bio, 'profile.location': location, 'profile.website': website }},
            { new: true }
        );
        if (user) {
            res.status(200).send('Profile updated');
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        res.status(500).send('Error updating profile');
    }
};

// Create a post
exports.createPost = async (req, res) => {
    try {
        const { username } = req.body;
        const { title, content } = req.body;
        const user = await User.findOne({ username });

        if (user) {
            user.posts.push({ title, content });
            await user.save();
            res.status(201).send('Post created');
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        res.status(500).send('Error creating post');
    }
};

// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
    try {
        const { username } = req.body;
        const file = req.file;
        
        if (!file) {
            return res.status(400).send('No file uploaded');
        }
        
        const filePath = path.join(__dirname, '../uploads', file.filename);
        const user = await User.findOne({ username });

        if (user) {
            user.profile.profilePicture = filePath;
            await user.save();
            res.status(200).send('Profile picture uploaded');
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        res.status(500).send('Error uploading profile picture');
    }
};
