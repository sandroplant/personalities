import mongoose from 'mongoose';
const { Schema } = mongoose;

const profileSchema = new Schema({
  fullName: { type: String, required: true },
  bio: { type: String, required: false },
  criteria: {
    humor: { type: Number, default: 0 },
    adventurousness: { type: Number, default: 0 }
    // Add other criteria fields as needed
  },
  spotifyInfo: {
    topArtists: [{ type: String }],
    topSongs: [{ type: String }],
    currentPlayback: { type: String }
  },
  favoriteMovies: [{ type: String }],
  favoriteBooks: [{ type: String }],
  appearance: {
    eyeColor: { type: String },
    height: { type: String },
    weight: { type: String },
    bodyType: { type: String },
    hairColor: { type: String },
    skinColor: { type: String }
  },
  hobbies: [{ type: String }],
  interests: [{ type: String }],
  profession: { type: String },
  education: { type: String },
  privacySettings: {
    spotifyInfo: { type: String, default: 'private' },
    favoriteMovies: { type: String, default: 'private' },
    favoriteBooks: { type: String, default: 'private' },
    appearance: { type: String, default: 'private' },
    hobbies: { type: String, default: 'private' },
    interests: { type: String, default: 'private' },
    profession: { type: String, default: 'private' },
    education: { type: String, default: 'private' }
  }
});

const Profile = mongoose.model('Profile', profileSchema);
export default Profile;
