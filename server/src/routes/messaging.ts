// server/src/routes/messaging.ts

import express, { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import Message, { IMessage } from '../models/Message.js';
import { rateLimit } from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import sanitizeHtml from 'sanitize-html';
import ensureAuthenticated from '../middleware/authMiddleware.js';
import { verifyCsrfToken } from '../middleware/csrfMiddleware.js';

const router = express.Router();

// Apply rate-limiting to all routes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: 'Too many requests, please try again later.',
});

// Middleware for sanitizing user input
const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
    req.body = mongoSanitize.sanitize(req.body);
    req.params = mongoSanitize.sanitize(req.params);
    next();
};

// Dummy AI function for responding (replace with actual AI service)
async function getAIResponse(content: string): Promise<string> {
    return `AI Response to: "${sanitizeHtml(content)}"`; // Placeholder for AI response
}

// Interface for request body in /send route
interface SendMessageRequest {
    senderId: string;
    recipientId: string;
    content: string;
    includeAI?: boolean;
}

// Send message with optional AI response
router.post(
    '/send',
    ensureAuthenticated,
    apiLimiter,
    verifyCsrfToken,
    sanitizeInput,
    [
        body('senderId').isMongoId().withMessage('Invalid sender ID').trim(),
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
    ],
    async (
        req: Request<Record<string, never>, unknown, SendMessageRequest>,
        res: Response
    ): Promise<void> => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { senderId, recipientId, content, includeAI } = req.body;

        try {
            let aiResponse: string | null = null;

            if (includeAI) {
                aiResponse = await getAIResponse(content);
            }

            const sanitizedContent = sanitizeHtml(content);

            const newMessage: IMessage = new Message({
                sender: senderId,
                recipient: recipientId,
                content: sanitizedContent,
                aiResponse,
            });

            await newMessage.save();
            res.status(200).json({
                message: 'Message sent successfully!',
                aiResponse,
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Error sending message:', error.message);
                res.status(500).json({ error: 'Failed to send message' });
            } else {
                console.error('Unknown error sending message:', error);
                res.status(500).json({
                    error: 'Failed to send message due to an unknown error.',
                });
            }
        }
    }
);

// Get conversation between two users
router.get(
    '/conversation/:userId1/:userId2',
    ensureAuthenticated,
    apiLimiter,
    verifyCsrfToken,
    sanitizeInput,
    [
        param('userId1').isMongoId().withMessage('Invalid user ID').trim(),
        param('userId2').isMongoId().withMessage('Invalid user ID').trim(),
    ],
    async (
        req: Request<{ userId1: string; userId2: string }, unknown>,
        res: Response
    ): Promise<void> => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { userId1, userId2 } = req.params;

        try {
            const messages: IMessage[] = await Message.find(
                {
                    $or: [
                        { sender: userId1, recipient: userId2 },
                        { sender: userId2, recipient: userId1 },
                    ],
                },
                null,
                { sanitizeFilter: true }
            ).sort({ timestamp: 1 });

            res.status(200).json(messages);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Error fetching conversation:', error.message);
                res.status(500).json({
                    error: 'Failed to retrieve conversation',
                });
            } else {
                console.error('Unknown error fetching conversation:', error);
                res.status(500).json({
                    error: 'Failed to retrieve conversation due to an unknown error.',
                });
            }
        }
    }
);

// Interface for request body in /send-mystery route
interface SendMysteryMessageRequest {
    senderId: string;
    recipientId: string;
    content: string;
}

// Send mystery message
router.post(
    '/send-mystery',
    ensureAuthenticated,
    apiLimiter,
    verifyCsrfToken,
    sanitizeInput,
    [
        body('senderId').isMongoId().withMessage('Invalid sender ID').trim(),
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
    ],
    async (
        req: Request<Record<string, never>, unknown, SendMysteryMessageRequest>,
        res: Response
    ): Promise<void> => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { senderId, recipientId, content } = req.body;

        try {
            const sanitizedContent = sanitizeHtml(content);

            const newMessage: IMessage = new Message({
                sender: senderId,
                recipient: recipientId,
                content: sanitizedContent,
                isMysteryMessage: true,
            });

            await newMessage.save();
            res.status(200).json({
                message: 'Mystery message sent successfully!',
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Error sending mystery message:', error.message);
                res.status(500).json({
                    error: 'Failed to send mystery message',
                });
            } else {
                console.error('Unknown error sending mystery message:', error);
                res.status(500).json({
                    error: 'Failed to send mystery message due to an unknown error.',
                });
            }
        }
    }
);

// Interface for request body in /start-call route
interface StartCallRequest {
    senderId: string;
    recipientId: string;
    callType: 'audio' | 'video';
}

// Start a call between users
router.post(
    '/start-call',
    ensureAuthenticated,
    apiLimiter,
    verifyCsrfToken,
    sanitizeInput,
    [
        body('senderId').isMongoId().withMessage('Invalid sender ID').trim(),
        body('recipientId')
            .isMongoId()
            .withMessage('Invalid recipient ID')
            .trim(),
        body('callType')
            .isIn(['audio', 'video'])
            .withMessage('Invalid call type')
            .trim(),
    ],
    async (
        req: Request<Record<string, never>, unknown, StartCallRequest>,
        res: Response
    ): Promise<void> => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { callType } = req.body;

        try {
            // Implement logic to start a call (e.g., generating a call token)
            res.json({ message: `Starting a ${callType} call between users.` });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Error starting call:', error.message);
                res.status(500).json({ error: 'Failed to start call' });
            } else {
                console.error('Unknown error starting call:', error);
                res.status(500).json({
                    error: 'Failed to start call due to an unknown error.',
                });
            }
        }
    }
);

export default router;
