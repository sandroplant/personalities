import express from 'express';
import User from '../models/User.js'; // Updated to include .js extension

const router = express.Router();

// Create or Update User Profile
router.post('/update-profile', async (req, res) => {
  const {
    userId,
    bio,
    location,
    website,
    profilePicture,
    charitabilityCoefficient
  } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        'profile.bio': bio,
        'profile.location': location,
        'profile.website': website,
        'profile.profilePicture': profilePicture,
        charitabilityCoefficient: charitabilityCoefficient // Update this line
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get User Profile
router.get('/get-profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      'profile charitabilityCoefficient'
    ); // Include this field

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
