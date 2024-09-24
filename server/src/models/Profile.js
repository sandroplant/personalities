const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const profileSchema = new Schema({
  fullName: { type: String, required: true },
  bio: { type: String, required: false },
  // Add other fields here as needed
});

module.exports = mongoose.model('Profile', profileSchema);
