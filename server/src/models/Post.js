// server/models/Post.js

import mongoose from 'mongoose';

// Sub-schema for External URLs to ensure valid URL formats
const ExternalURLSchema = new mongoose.Schema({
    spotify: {
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                return /^https?:\/\/.+/.test(v);
            },
            message: props => `${props.value} is not a valid URL!`
        }
    }
}, { _id: false });

// Main Post Schema with comprehensive validations
const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Post title is required'],
        trim: true,
        maxlength: [200, 'Post title cannot exceed 200 characters']
    },
    content: {
        type: String,
        required: [true, 'Post content is required'],
        trim: true,
        maxlength: [5000, 'Post content cannot exceed 5000 characters']
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Author is required'],
        validate: {
            validator: function(v) {
                return mongoose.Types.ObjectId.isValid(v);
            },
            message: props => `${props.value} is not a valid User ID!`
        }
    },
    comments: [{
        commenter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Commenter is required'],
            validate: {
                validator: function(v) {
                    return mongoose.Types.ObjectId.isValid(v);
                },
                message: props => `${props.value} is not a valid User ID!`
            }
        },
        comment: {
            type: String,
            required: [true, 'Comment is required'],
            trim: true,
            maxlength: [1000, 'Comment cannot exceed 1000 characters']
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    likes: {
        type: Number,
        default: 0,
        min: [0, 'Likes cannot be negative']
    },
    shares: {
        type: Number,
        default: 0,
        min: [0, 'Shares cannot be negative']
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [50, 'Tag cannot exceed 50 characters']
    }],
    externalUrls: ExternalURLSchema,
    isPublished: {
        type: Boolean,
        default: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Prevent Prototype Pollution by disabling '__proto__' and 'constructor' paths
postSchema.path('__proto__', undefined);
postSchema.path('constructor', undefined);

// Export the Post model
const Post = mongoose.model('Post', postSchema);
export default Post;
