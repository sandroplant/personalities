// server/models/User.ts
import mongoose, { Schema } from 'mongoose'; // Added CallbackError
import bcrypt from 'bcrypt';
// Sub-schema for Images
const ImageSchema = new Schema({
    url: {
        type: String,
        match: [/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i, 'Invalid image URL'],
    },
}, { _id: false });
// Sub-schema for Top Artists
const TopArtistSchema = new Schema({
    name: { type: String, required: true, trim: true },
    external_urls: {
        type: Map,
        of: String,
        default: {},
    },
    images: [ImageSchema],
}, { _id: false });
// Sub-schema for Top Tracks
const TopTrackSchema = new Schema({
    name: { type: String, required: true, trim: true },
    album: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {},
    },
    external_urls: {
        type: Map,
        of: String,
        default: {},
    },
}, { _id: false });
// Sub-schema for Friend Evaluations
const FriendEvaluationSchema = new Schema({
    evaluatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    scores: [
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
}, { _id: false });
// Main User Schema with comprehensive validations
const userSchema = new Schema({
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
    images: [ImageSchema],
    topArtists: [TopArtistSchema],
    topTracks: [TopTrackSchema],
    currentlyPlaying: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {},
    },
    profile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: false, // Depending on application logic
    },
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
    musicPreferences: [
        {
            type: String,
            trim: true,
        },
    ],
    favoriteMovies: [
        {
            type: String,
            trim: true,
        },
    ],
    friendEvaluations: [FriendEvaluationSchema],
    privacySettings: {
        type: Map,
        of: {
            type: String,
            enum: ['public', 'friends-only', 'private'],
            default: 'private',
        },
    },
}, { timestamps: true });
// Pre-save hook to hash passwords before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    try {
        const saltRounds = 12; // Adjust salt rounds as needed
        const salt = await bcrypt.genSalt(saltRounds);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    }
    catch (err) {
        next(err); // Fixed type mismatch by casting err as CallbackError
    }
});
// Method to compare entered password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};
const User = mongoose.model('User', userSchema);
export default User;
