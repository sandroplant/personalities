import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    spotifyId: { type: String, required: true, unique: true },
    displayName: { type: String },
    email: { type: String, unique: true },
    images: [{ url: String }],
    topArtists: [{ name: String, external_urls: Object, images: Array }],
    topTracks: [{ name: String, album: Object, external_urls: Object }],
    currentlyPlaying: { type: Object },
    profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }, // Reference to Profile
});

const User = mongoose.model('User', userSchema);

export default User;
