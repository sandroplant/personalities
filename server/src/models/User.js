// server/models/User.js

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    spotifyId: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true, 
    },
    displayName: { 
        type: String, 
        trim: true,
    },
    email: { 
        type: String, 
        unique: true, 
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please fill a valid email address',
        ],
    },
    username: { 
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        match: [/^[a-zA-Z0-9]+$/, 'Username must be alphanumeric'],
        trim: true,
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'], 
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false, // Exclude password from query results by default
    },
    images: [{ 
        url: {
            type: String,
            match: [/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i, 'Invalid image URL'],
        },
    }],
    topArtists: [{
        name: { type: String, required: true, trim: true },
        external_urls: {
            type: Object,
            default: {},
        },
        images: [{
            url: {
                type: String,
                match: [/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i, 'Invalid image URL'],
            },
        }],
    }],
    topTracks: [{
        name: { type: String, required: true, trim: true },
        album: {
            type: Object,
            default: {},
        },
        external_urls: {
            type: Object,
            default: {},
        },
    }],
    currentlyPlaying: { 
        type: Object, 
        default: {},
    },
    profile: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Profile',
        required: false, // Depending on application logic
    }, // Reference to Profile
    fullName: { 
        type: String, 
        required: [true, 'Full name is required'], 
        trim: true,
        maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    bio: { 
        type: String, 
        required: false,
        trim: true,
        maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    evaluatedCharacteristics: [
        {
            criterion: { 
                type: String, 
                required: true, 
                trim: true,
            },
            score: { 
                type: Number, 
                required: true, 
                min: 0, 
                max: 100,
            },
        },
    ],
    musicPreferences: [{
        type: String,
        trim: true,
    }], // For Spotify or other music integrations
    favoriteMovies: [{
        type: String,
        trim: true,
    }],
    friendEvaluations: [
        {
            evaluatorId: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'User',
                required: true,
            }, // Reference to the friend's user ID
            scores: [{
                criterion: { 
                    type: String, 
                    required: true, 
                    trim: true,
                },
                score: { 
                    type: Number, 
                    required: true, 
                    min: 0, 
                    max: 100,
                },
            }],
        },
    ],
    privacySettings: {
        type: Map,
        of: {
            type: String,
            enum: ['public', 'friends-only', 'private'],
            default: 'private',
        }, // e.g., "public", "friends-only", "private"
    },
}, { timestamps: true });

// Pre-save hook to hash passwords before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const saltRounds = 12; // Adjust salt rounds as needed
        const salt = await bcrypt.genSalt(saltRounds);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Method to compare entered password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
