const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile: {
        bio: { type: String, default: '' },
        location: { type: String, default: '' },
        website: { type: String, default: '' },
        profilePicture: { type: String, default: '' } // Add profile picture field
    },
    posts: [{
        title: String,
        content: String,
        createdAt: { type: Date, default: Date.now }
    }]
});

module.exports = mongoose.model('User', UserSchema);
