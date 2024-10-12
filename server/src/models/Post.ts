// server/src/models/Post.ts

import mongoose, { Schema, model, Document } from 'mongoose';

// Sub-schema for External URLs to ensure valid URL formats
const ExternalURLSchema: Schema = new Schema(
  {
    spotify: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^https?:\/\/.+/.test(v);
        },
        message: (props: any) => `${props.value} is not a valid URL!`,
      },
    },
  },
  { _id: false }
);

// Sub-schema for Comments
interface IComment {
  commenter: mongoose.Types.ObjectId;
  comment: string;
  timestamp: Date;
}

const CommentSchema: Schema = new Schema(
  {
    commenter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Commenter is required'],
      validate: {
        validator: function (v: string) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: (props: any) => `${props.value} is not a valid User ID!`,
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
      default: () => new Date(), // Updated to return Date object
    },
  },
  { _id: false }
);

// Interface for Post Document
export interface IPost extends Document {
  title: string;
  content: string;
  author: mongoose.Types.ObjectId;
  comments: IComment[];
  likes: number;
  shares: number;
  tags: string[];
  externalUrls: {
    spotify?: string;
  };
  isPublished: boolean;
  timestamp: Date;
  createdAt: Date; // Managed by Mongoose's timestamps
  updatedAt: Date; // Managed by Mongoose's timestamps
}

// Main Post Schema with comprehensive validations
const postSchema: Schema<IPost> = new Schema(
  {
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
        validator: function (v: string) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: (props: any) => `${props.value} is not a valid User ID!`,
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
      default: () => new Date(), // Updated to return Date object
    },
    // Removed 'createdAt' and 'updatedAt' as they are managed by 'timestamps: true'
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Prevent Prototype Pollution by disabling '__proto__' and 'constructor' paths
postSchema.path('__proto__', undefined);
postSchema.path('constructor', undefined);

// Export the Post model
const Post = model<IPost>('Post', postSchema);
export default Post;
