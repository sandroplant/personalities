import mongoose, { Document, Schema } from 'mongoose';

// Sub-schema for Appearance details with strict validation
const AppearanceSchema: Schema = new Schema(
    {
        eyeColor: {
            type: String,
            trim: true,
            maxlength: [50, 'Eye color cannot exceed 50 characters'],
        },
        height: {
            type: String,
            trim: true,
            maxlength: [50, 'Height description cannot exceed 50 characters'],
        },
        weight: {
            type: String,
            trim: true,
            maxlength: [50, 'Weight description cannot exceed 50 characters'],
        },
        bodyType: {
            type: String,
            trim: true,
            maxlength: [
                50,
                'Body type description cannot exceed 50 characters',
            ],
        },
        hairColor: {
            type: String,
            trim: true,
            maxlength: [50, 'Hair color cannot exceed 50 characters'],
        },
        skinColor: {
            type: String,
            trim: true,
            maxlength: [50, 'Skin color cannot exceed 50 characters'],
        },
    },
    { _id: false }
);

// Sub-schema for Privacy Settings with enum validation
const PrivacySettingsSchema: Schema = new Schema(
    {
        spotifyInfo: {
            type: String,
            enum: ['public', 'friends-only', 'private'],
            default: 'private',
        },
        favoriteMovies: {
            type: String,
            enum: ['public', 'friends-only', 'private'],
            default: 'private',
        },
        favoriteBooks: {
            type: String,
            enum: ['public', 'friends-only', 'private'],
            default: 'private',
        },
        appearance: {
            type: String,
            enum: ['public', 'friends-only', 'private'],
            default: 'private',
        },
        hobbies: {
            type: String,
            enum: ['public', 'friends-only', 'private'],
            default: 'private',
        },
        interests: {
            type: String,
            enum: ['public', 'friends-only', 'private'],
            default: 'private',
        },
        profession: {
            type: String,
            enum: ['public', 'friends-only', 'private'],
            default: 'private',
        },
        education: {
            type: String,
            enum: ['public', 'friends-only', 'private'],
            default: 'private',
        },
    },
    { _id: false }
);

// Interface for Profile Document
export interface IProfile extends Document {
    fullName: string;
    bio: string;
    criteria: {
        humor: number;
        adventurousness: number;
    };
    spotifyInfo: {
        topArtists: string[];
        topTracks: string[];
        currentPlayback?: string;
    };
    favoriteMovies: string[];
    favoriteBooks: string[];
    appearance: {
        eyeColor?: string;
        height?: string;
        weight?: string;
        bodyType?: string;
        hairColor?: string;
        skinColor?: string;
    };
    hobbies: string[];
    interests: string[];
    profession: string;
    education: string;
    privacySettings: {
        spotifyInfo: 'public' | 'friends-only' | 'private';
        favoriteMovies: 'public' | 'friends-only' | 'private';
        favoriteBooks: 'public' | 'friends-only' | 'private';
        appearance: 'public' | 'friends-only' | 'private';
        hobbies: 'public' | 'friends-only' | 'private';
        interests: 'public' | 'friends-only' | 'private';
        profession: 'public' | 'friends-only' | 'private';
        education: 'public' | 'friends-only' | 'private';
    };
    createdAt: Date;
    updatedAt: Date;
}

// Main Profile Schema with comprehensive validations
const profileSchema: Schema = new Schema(
    {
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
            maxlength: [100, 'Full name cannot exceed 100 characters'],
        },
        bio: {
            type: String,
            trim: true,
            maxlength: [500, 'Bio cannot exceed 500 characters'],
            default: '',
        },
        criteria: {
            humor: {
                type: Number,
                default: 0,
                min: [0, 'Humor score cannot be negative'],
                max: [100, 'Humor score cannot exceed 100'],
            },
            adventurousness: {
                type: Number,
                default: 0,
                min: [0, 'Adventurousness score cannot be negative'],
                max: [100, 'Adventurousness score cannot exceed 100'],
            },
        },
        spotifyInfo: {
            topArtists: {
                type: [String],
                default: [],
                validate: {
                    validator: function (v: string[]) {
                        return Array.isArray(v) && v.length <= 50;
                    },
                    message: 'A maximum of 50 top artists are allowed.',
                },
            },
            topTracks: {
                type: [String],
                default: [],
                validate: {
                    validator: function (v: string[]) {
                        return Array.isArray(v) && v.length <= 50;
                    },
                    message: 'A maximum of 50 top songs are allowed.',
                },
            },
            currentPlayback: {
                type: String,
                trim: true,
                maxlength: [
                    200,
                    'Current playback information cannot exceed 200 characters',
                ],
            },
        },
        favoriteMovies: {
            type: [String],
            default: [],
            validate: {
                validator: function (v: string[]) {
                    return Array.isArray(v) && v.length <= 100;
                },
                message: 'A maximum of 100 favorite movies are allowed.',
            },
        },
        favoriteBooks: {
            type: [String],
            default: [],
            validate: {
                validator: function (v: string[]) {
                    return Array.isArray(v) && v.length <= 100;
                },
                message: 'A maximum of 100 favorite books are allowed.',
            },
        },
        appearance: {
            type: AppearanceSchema,
            default: () => ({}),
        },
        hobbies: {
            type: [String],
            default: [],
            validate: {
                validator: function (v: string[]) {
                    return Array.isArray(v) && v.length <= 100;
                },
                message: 'A maximum of 100 hobbies are allowed.',
            },
        },
        interests: {
            type: [String],
            default: [],
            validate: {
                validator: function (v: string[]) {
                    return Array.isArray(v) && v.length <= 100;
                },
                message: 'A maximum of 100 interests are allowed.',
            },
        },
        profession: {
            type: String,
            trim: true,
            maxlength: [
                100,
                'Profession description cannot exceed 100 characters',
            ],
            default: '',
        },
        education: {
            type: String,
            trim: true,
            maxlength: [
                100,
                'Education description cannot exceed 100 characters',
            ],
            default: '',
        },
        privacySettings: {
            type: PrivacySettingsSchema,
            default: () => ({}),
        },
        createdAt: {
            type: Date,
            default: Date.now,
            immutable: true,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Middleware to update 'updatedAt' field on document update
profileSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updatedAt: Date.now() });
    next();
});

// Prevent Prototype Pollution by disabling '__proto__' and 'constructor' paths
profileSchema.path('__proto__', undefined);
profileSchema.path('constructor', undefined);

// Export the Profile model
const Profile = mongoose.model<IProfile>('Profile', profileSchema);
export default Profile;
