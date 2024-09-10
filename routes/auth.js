const express = require('express');
const router = express.Router();
const { register, login, createPost } = require('../controllers/authController'); // Ensure createPost is imported

// Register route
router.post('/register', register);

// Login route
router.post('/login', login);

// Create Post route
router.post('/create-post', createPost); // Add this line

module.exports = router;
