import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import Message, { IMessage } from '../models/Message.js';
import { csrfProtection } from '../middleware/csrfMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Apply rate-limiting to all routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
});

// Dummy AI function for responding (replace with actual AI service)
async function getAIResponse(content: string): Promise<string> {
  return `AI Response to: "${content}"`; // Placeholder for AI response
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
  apiLimiter,
  csrfProtection, // Apply CSRF protection middleware
  [
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
  ],
  async (req: Request<Record<string, unknown>, Record<string, unknown>, SendMessageRequest>, res: Response): Promise<void> => {
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

      const newMessage: IMessage = new Message({
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
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
);

// Get conversation between two users
router.get(
  '/conversation/:userId1/:userId2',
  apiLimiter,
  csrfProtection, // Apply CSRF protection middleware
  [
    param('userId1').isMongoId().withMessage('Invalid user ID').trim().escape(),
    param('userId2').isMongoId().withMessage('Invalid user ID').trim().escape(),
  ],
  async (req: Request<{ userId1: string; userId2: string }>, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { userId1, userId2 } = req.params;

    try {
      const messages: IMessage[] = await Message.find({
        $or: [
          { sender: userId1, recipient: userId2 },
          { sender: userId2, recipient: userId1 },
        ],
      }).sort({ timestamp: 1 });

      res.status(200).json(messages);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({ error: 'Failed to retrieve conversation' });
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
  apiLimiter,
  csrfProtection, // Apply CSRF protection middleware
  [
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
  ],
  async (req: Request<Record<string, any>, unknown, SendMysteryMessageRequest>, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { senderId, recipientId, content } = req.body;

    try {
      const newMessage: IMessage = new Message({
        sender: senderId,
        recipient: recipientId,
        content,
        isMysteryMessage: true, // Mark as mystery message
      });

      await newMessage.save();
      res.status(200).json({ message: 'Mystery message sent successfully!' });
    } catch (error) {
      console.error('Error sending mystery message:', error);
      res.status(500).json({ error: 'Failed to send mystery message' });
    }
  }
);

// Open mystery message and trigger reaction recording
router.get(
  '/open-mystery/:messageId',
  apiLimiter,
  csrfProtection, // Apply CSRF protection middleware
  [
    param('messageId')
      .isMongoId()
      .withMessage('Invalid message ID')
      .trim()
      .escape(),
  ],
  async (req: Request<{ messageId: string }>, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { messageId } = req.params;

    try {
      const message: IMessage | null = await Message.findById(messageId);

      if (message?.isMysteryMessage) {
        res.json({ message: 'Recording reaction for mystery message!' });
      } else {
        res.status(400).json({ error: 'This is not a mystery message.' });
      }
    } catch (error) {
      console.error('Error opening mystery message:', error);
      res.status(500).json({ error: 'Failed to open mystery message' });
    }
  }
);

// Interface for request body in /start-call route
interface StartCallRequest {
  senderId: string;
  recipientId: string;
  callType: 'audio' | 'video';
}

// Placeholder for starting a call
router.post(
  '/start-call',
  apiLimiter,
  csrfProtection, // Apply CSRF protection middleware
  [
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
  ],
  async (req: Request<Record<string, any>, unknown, StartCallRequest>, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { callType } = req.body;

    res.json({ message: `Starting a ${callType} call between users.` });
  }
);

export default router;
