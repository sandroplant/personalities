const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  bio: { type: String, required: false },
  evaluatedCharacteristics: [
    {
      criterion: String,
      score: Number,
    },
  ],
  musicPreferences: [String], // For Spotify or other music integrations
  favoriteMovies: [String],
  friendEvaluations: [
    {
      evaluatorId: mongoose.Schema.Types.ObjectId, // Reference to the friend's user ID
      scores: [{ criterion: String, score: Number }],
    },
  ],
  privacySettings: {
    type: Map,
    of: String, // e.g., "public", "friends-only", "private"
  },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
