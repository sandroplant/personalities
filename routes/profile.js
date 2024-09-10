const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, createPost, uploadProfilePicture } = require('../controllers/profileController');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Get user profile
router.get('/:username', getProfile);

// Update user profile
router.put('/:username', updateProfile);

// Create a post
router.post('/create-post', createPost);

// Upload profile picture
router.post('/upload-profile-picture', upload.single('profilePicture'), uploadProfilePicture);

module.exports = router;
