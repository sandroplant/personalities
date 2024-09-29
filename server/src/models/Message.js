// server/models/Message.js

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

// Main Message Schema with comprehensive validations
const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Sender is required'],
        validate: {
            validator: function(v) {
                return mongoose.Types.ObjectId.isValid(v);
            },
            message: props => `${props.value} is not a valid User ID!`
        }
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Recipient is required'],
        validate: {
            validator: function(v) {
                return mongoose.Types.ObjectId.isValid(v);
            },
            message: props => `${props.value} is not a valid User ID!`
        }
    },
    content: {
        type: String,
        required: [true, 'Message content is required'],
        trim: true,
        maxlength: [1000, 'Message content cannot exceed 1000 characters']
    },
    aiResponse: {
        type: String,
        trim: true,
        maxlength: [2000, 'AI response cannot exceed 2000 characters'],
        default: ''
    },
    isMysteryMessage: {
        type: Boolean,
        default: false
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
messageSchema.path('__proto__', undefined);
messageSchema.path('constructor', undefined);

// Export the Message model
const Message = mongoose.model('Message', messageSchema);
export default Message;
