// server/src/routes/ai.ts

// Import the env module to load environment variables
import '../config/env.js'; // Ensure the correct relative path and file extension

import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import OpenAI from 'openai';
import rateLimit from 'express-rate-limit';
import { verifyCsrfToken } from '../middleware/csrfMiddleware.js';
import mongoSanitize from 'express-mongo-sanitize';
import sanitizeHtml from 'sanitize-html';
import ensureAuthenticated from '../middleware/authMiddleware.js';
import '../config/env.js';

const router = express.Router();

// Ensure OpenAI API key is present
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OpenAI API key is missing in environment variables');
}

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY as string,
});

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
});

// Input validation and sanitization using express-validator
const validateGenerate = [
  body('prompt')
    .notEmpty()
    .withMessage('Prompt is required')
    .isString()
    .withMessage('Prompt must be a string')
    .trim(),
  body('maxTokens')
    .optional()
    .isInt({ min: 1, max: 2000 })
    .withMessage('maxTokens must be between 1 and 2000')
    .toInt(),
];

// Middleware for sanitizing user input
const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  req.body.prompt = sanitizeHtml(req.body.prompt);
  mongoSanitize.sanitize(req.body);
  next();
};

// Define the OpenAI response structure
interface OpenAIChoice {
  message: {
    content: string | null;
  };
}

interface OpenAIResponse {
  choices: OpenAIChoice[];
}

const isProduction = process.env.NODE_ENV === 'production';

// Route for generating AI response, protected with CSRF and rate-limited
router.post(
  '/generate',
  ensureAuthenticated,
  apiLimiter, // Apply rate limiting middleware
  verifyCsrfToken, // Apply CSRF protection middleware
  validateGenerate, // Apply input validation middleware
  sanitizeInput, // Apply input sanitization middleware
  async (req: Request, res: Response): Promise<void> => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    // Destructure prompt and maxTokens from the request body
    const { prompt, maxTokens = 150 } = req.body;

    try {
      // Call OpenAI API to generate a completion
      const response: OpenAIResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
      });

      // Handle AI response
      const aiMessage = response.choices[0].message?.content ?? ''; // Default to empty string if no content
      if (aiMessage.trim()) {
        res.json({ result: sanitizeHtml(aiMessage) });
      } else {
        res.status(500).json({ error: 'AI did not return a valid message.' });
      }
    } catch (error: any) {
      // Error handling based on environment
      if (isProduction) {
        console.error(error); // Log error for monitoring in production
        res.status(500).send('Error generating response');
      } else {
        res.status(500).send(`Error generating response: ${error.message}`);
      }
    }
  }
);

export default router;
