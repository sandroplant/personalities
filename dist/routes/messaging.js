import express from 'express';
import { body, param, validationResult } from 'express-validator';
import Message from '../models/Message.js';
import { verifyCsrfToken } from '../middleware/csrfMiddleware.js';
import rateLimit from 'express-rate-limit';
const router = express.Router();
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
async function getAIResponse(content) {
    return `AI Response to: "${content}"`;
}
router.post('/send', apiLimiter, verifyCsrfToken, [
    body('senderId')
        .isMongoId()
        .withMessage('Invalid sender ID')
        .trim()
        .escape(),
    body('recipientId')
        .isMongoId()
        .withMessage('Invalid recipient ID')
        .trim()
        .escape(),
    body('content')
        .notEmpty()
        .withMessage('Content is required')
        .isString()
        .withMessage('Content must be a string')
        .trim()
        .escape(),
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
            content,
            aiResponse,
        });
        await newMessage.save();
        res.status(200).json({
            message: 'Message sent successfully!',
            aiResponse,
        });
    }
    catch {
        res.status(500).json({ error: 'Failed to send message' });
    }
});
router.get('/conversation/:userId1/:userId2', apiLimiter, verifyCsrfToken, [
    param('userId1').isMongoId().withMessage('Invalid user ID').trim().escape(),
    param('userId2').isMongoId().withMessage('Invalid user ID').trim().escape(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
    }
    const { userId1, userId2 } = req.params;
    try {
        const messages = await Message.find({
            $or: [
                { sender: userId1, recipient: userId2 },
                { sender: userId2, recipient: userId1 },
            ],
        }).sort({ timestamp: 1 });
        res.status(200).json(messages);
    }
    catch {
        res.status(500).json({ error: 'Failed to retrieve conversation' });
    }
});
router.post('/send-mystery', apiLimiter, verifyCsrfToken, [
    body('senderId')
        .isMongoId()
        .withMessage('Invalid sender ID')
        .trim()
        .escape(),
    body('recipientId')
        .isMongoId()
        .withMessage('Invalid recipient ID')
        .trim()
        .escape(),
    body('content')
        .notEmpty()
        .withMessage('Content is required')
        .isString()
        .withMessage('Content must be a string')
        .trim()
        .escape(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
    }
    const { senderId, recipientId, content } = req.body;
    try {
        const newMessage = new Message({
            sender: senderId,
            recipient: recipientId,
            content,
            isMysteryMessage: true,
        });
        await newMessage.save();
        res.status(200).json({ message: 'Mystery message sent successfully!' });
    }
    catch {
        res.status(500).json({ error: 'Failed to send mystery message' });
    }
});
router.get('/open-mystery/:messageId', apiLimiter, verifyCsrfToken, [
    param('messageId')
        .isMongoId()
        .withMessage('Invalid message ID')
        .trim()
        .escape(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { messageId } = req.params;
    try {
        const message = await Message.findById(messageId);
        if (message?.isMysteryMessage) {
            res.json({ message: 'Recording reaction for mystery message!' });
        }
        else {
            res.status(400).json({ error: 'This is not a mystery message.' });
        }
    }
    catch {
        res.status(500).json({ error: 'Failed to open mystery message' });
    }
});
router.post('/start-call', apiLimiter, verifyCsrfToken, [
    body('senderId')
        .isMongoId()
        .withMessage('Invalid sender ID')
        .trim()
        .escape(),
    body('recipientId')
        .isMongoId()
        .withMessage('Invalid recipient ID')
        .trim()
        .escape(),
    body('callType')
        .isIn(['audio', 'video'])
        .withMessage('Invalid call type')
        .trim()
        .escape(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { senderId, recipientId, callType } = req.body;
    res.json({ message: `Starting a ${callType} call between users.` });
});
export default router;
