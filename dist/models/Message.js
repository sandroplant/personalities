import mongoose, { Schema } from 'mongoose';
// Main Message Schema with comprehensive validations
const messageSchema = new Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Sender is required'],
        validate: {
            validator: function (v) {
                return mongoose.Types.ObjectId.isValid(v);
            },
            message: (props) => `${props.value} is not a valid User ID!`,
        },
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Recipient is required'],
        validate: {
            validator: function (v) {
                return mongoose.Types.ObjectId.isValid(v);
            },
            message: (props) => `${props.value} is not a valid User ID!`,
        },
    },
    content: {
        type: String,
        required: [true, 'Message content is required'],
        trim: true,
        maxlength: [1000, 'Message content cannot exceed 1000 characters'],
    },
    aiResponse: {
        type: String,
        trim: true,
        maxlength: [2000, 'AI response cannot exceed 2000 characters'],
        default: '',
    },
    isMysteryMessage: {
        type: Boolean,
        default: false,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Prevent Prototype Pollution by disabling '__proto__' and 'constructor' paths
messageSchema.path('__proto__', undefined);
messageSchema.path('constructor', undefined);
// Export the Message model
const Message = mongoose.model('Message', messageSchema);
export default Message;
