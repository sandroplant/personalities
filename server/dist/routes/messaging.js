// server/routes/messaging.ts
import express from 'express';
import { body, param, validationResult } from 'express-validator';
import Message from '../models/Message.js';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import sanitizeHtml from 'sanitize-html';
import ensureAuthenticated from '../middleware/authMiddleware.js';
import { verifyCsrfToken } from '../middleware/csrfMiddleware.js';
const router = express.Router();
// Apply rate-limiting to all routes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later.',
});
// Middleware for sanitizing user input
const sanitizeInput = (req, _res, next) => {
    mongoSanitize.sanitize(req.body);
    mongoSanitize.sanitize(req.params);
    next();
};
// Dummy AI function for responding (replace with actual AI service)
async function getAIResponse(content) {
    return `AI Response to: "${sanitizeHtml(content)}"`; // Placeholder for AI response
}
// Send message with optional AI response
router.post('/send', ensureAuthenticated, apiLimiter, verifyCsrfToken, sanitizeInput, [
    body('senderId')
        .isMongoId()
        .withMessage('Invalid sender ID')
        .trim(),
    body('recipientId')
        .isMongoId()
        .withMessage('Invalid recipient ID')
        .trim(),
    body('content')
        .notEmpty()
        .withMessage('Content is required')
        .isString()
        .withMessage('Content must be a string')
        .trim(),
    body('includeAI')
        .optional()
        .isBoolean()
        .withMessage('Invalid includeAI value'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { senderId, recipientId, content, includeAI } = req.body;
    try {
        let aiResponse = null;
        if (includeAI) {
            aiResponse = await getAIResponse(content);
        }
        const newMessage = new Message({
            sender: senderId,
            recipient: recipientId,
            content: sanitizeHtml(content),
            aiResponse,
        });
        await newMessage.save();
        res.status(200).json({
            message: 'Message sent successfully!',
            aiResponse,
        });
    }
    catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});
// Get conversation between two users
router.get('/conversation/:userId1/:userId2', ensureAuthenticated, apiLimiter, verifyCsrfToken, sanitizeInput, [
    param('userId1').isMongoId().withMessage('Invalid user ID').trim(),
    param('userId2').isMongoId().withMessage('Invalid user ID').trim(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { userId1, userId2 } = req.params;
    try {
        const messages = await Message.find({
            $or: [
                { sender: userId1, recipient: userId2 },
                { sender: userId2, recipient: userId1 },
            ],
        }, null, { sanitizeFilter: true }).sort({ timestamp: 1 });
        res.status(200).json(messages);
    }
    catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ error: 'Failed to retrieve conversation' });
    }
});
// Send mystery message
router.post('/send-mystery', ensureAuthenticated, apiLimiter, verifyCsrfToken, sanitizeInput, [
    body('senderId')
        .isMongoId()
        .withMessage('Invalid sender ID')
        .trim(),
    body('recipientId')
        .isMongoId()
        .withMessage('Invalid recipient ID')
        .trim(),
    body('content')
        .notEmpty()
        .withMessage('Content is required')
        .isString()
        .withMessage('Content must be a string')
        .trim(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { senderId, recipientId, content } = req.body;
    try {
        const newMessage = new Message({
            sender: senderId,
            recipient: recipientId,
            content: sanitizeHtml(content),
            isMysteryMessage: true,
        });
        await newMessage.save();
        res.status(200).json({ message: 'Mystery message sent successfully!' });
    }
    catch (error) {
        console.error('Error sending mystery message:', error);
        res.status(500).json({ error: 'Failed to send mystery message' });
    }
});
// Open mystery message and trigger reaction recording
router.get('/open-mystery/:messageId', ensureAuthenticated, apiLimiter, verifyCsrfToken, sanitizeInput, [
    param('messageId')
        .isMongoId()
        .withMessage('Invalid message ID')
        .trim(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { messageId } = req.params;
    try {
        const message = await Message.findById(messageId, null, { sanitizeFilter: true });
        if (message?.isMysteryMessage) {
            // Implement logic to record the user's reaction
            res.json({ message: 'Recording reaction for mystery message!' });
        }
        else {
            res.status(400).json({ error: 'This is not a mystery message.' });
        }
    }
    catch (error) {
        console.error('Error opening mystery message:', error);
        res.status(500).json({ error: 'Failed to open mystery message' });
    }
});
// Start a call between users
router.post('/start-call', ensureAuthenticated, apiLimiter, verifyCsrfToken, sanitizeInput, [
    body('senderId')
        .isMongoId()
        .withMessage('Invalid sender ID')
        .trim(),
    body('recipientId')
        .isMongoId()
        .withMessage('Invalid recipient ID')
        .trim(),
    body('callType')
        .isIn(['audio', 'video'])
        .withMessage('Invalid call type')
        .trim(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { callType } = req.body;
    try {
        // Implement logic to start a call (e.g., generating a call token)
        res.json({ message: `Starting a ${callType} call between users.` });
    }
    catch (error) {
        console.error('Error starting call:', error);
        res.status(500).json({ error: 'Failed to start call' });
    }
});
export default router;
