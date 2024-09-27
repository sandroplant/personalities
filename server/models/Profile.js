import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
    fullName: String,
    bio: String,
    criteria: {
        humor: Number,
        adventurousness: Number,
        // add other criteria as needed
    },
    spotifyInfo: {
        topArtists: [String],
        topSongs: [String],
        currentPlayback: String,
    },
    favoriteMovies: [String],
    favoriteBooks: [String],
    appearance: {
        eyeColor: String,
        height: Number, // in cm
        weight: Number, // in kg
        bodyType: String,
        hairColor: String,
        skinColor: String,
    },
    hobbies: [String],
    interests: [String],
    profession: String,
    education: String,
    privacySettings: {
        spotifyInfo: { type: String, enum: ['public', 'friends', 'private'] },
        favoriteMovies: {
            type: String,
            enum: ['public', 'friends', 'private'],
        },
        favoriteBooks: { type: String, enum: ['public', 'friends', 'private'] },
        appearance: { type: String, enum: ['public', 'friends', 'private'] },
        hobbies: { type: String, enum: ['public', 'friends', 'private'] },
        interests: { type: String, enum: ['public', 'friends', 'private'] },
        profession: { type: String, enum: ['public', 'friends', 'private'] },
        education: { type: String, enum: ['public', 'friends', 'private'] },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Profile', profileSchema);
