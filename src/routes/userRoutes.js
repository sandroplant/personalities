const express = require('express');
const User = require('../models/User');
const router = express.Router();
const ensureAuthenticated = require('../middleware/authMiddleware'); // Make sure this middleware is implemented

// Create or update user profile
router.post('/profile', ensureAuthenticated, async (req, res) => {
  const { fullName, bio, evaluatedCharacteristics, musicPreferences, favoriteMovies } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.user._id }, // Assuming req.user is set after authentication
      { fullName, bio, evaluatedCharacteristics, musicPreferences, favoriteMovies },
      { new: true, upsert: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user profile
router.get('/profile', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Delete user profile
router.delete('/profile', ensureAuthenticated, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Profile deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete profile' });
  }
});

module.exports = router;
