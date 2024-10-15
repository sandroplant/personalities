import mongoose, { Schema, model } from 'mongoose';
const ExternalURLSchema = new Schema({
    spotify: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                return /^https?:\/\/.+/.test(v);
            },
            message: (props) => `${props.value} is not a valid URL!`,
        },
    },
}, { _id: false });
const CommentSchema = new Schema({
    commenter: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Commenter is required'],
        validate: {
            validator: function (v) {
                return mongoose.Types.ObjectId.isValid(v);
            },
            message: (props) => `${props.value} is not a valid User ID!`,
        },
    },
    comment: {
        type: String,
        required: [true, 'Comment is required'],
        trim: true,
        maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    timestamp: {
        type: Date,
        default: () => new Date(),
    },
}, { _id: false });
const postSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Post title is required'],
        trim: true,
        maxlength: [200, 'Post title cannot exceed 200 characters'],
    },
    content: {
        type: String,
        required: [true, 'Post content is required'],
        trim: true,
        maxlength: [5000, 'Post content cannot exceed 5000 characters'],
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Author is required'],
        validate: {
            validator: function (v) {
                return mongoose.Types.ObjectId.isValid(v);
            },
            message: (props) => `${props.value} is not a valid User ID!`,
        },
    },
    comments: [CommentSchema],
    likes: {
        type: Number,
        default: 0,
        min: [0, 'Likes cannot be negative'],
    },
    shares: {
        type: Number,
        default: 0,
        min: [0, 'Shares cannot be negative'],
    },
    tags: [
        {
            type: String,
            trim: true,
            maxlength: [50, 'Tag cannot exceed 50 characters'],
        },
    ],
    externalUrls: ExternalURLSchema,
    isPublished: {
        type: Boolean,
        default: true,
    },
    timestamp: {
        type: Date,
        default: () => new Date(),
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
postSchema.path('__proto__', undefined);
postSchema.path('constructor', undefined);
const Post = model('Post', postSchema);
export default Post;
