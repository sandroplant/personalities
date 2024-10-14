import 'dotenv/config';
import express from 'express';
import { body, validationResult } from 'express-validator';
import OpenAI from 'openai';
import rateLimit from 'express-rate-limit';
import verifyCsrfToken from '../middleware/verifyCsrfToken.js'; // Corrected path
const router = express.Router();
if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is missing in environment variables');
}
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // Limit each IP to 100 requests per window
});
// Input validation and sanitization
const validateGenerate = [
    body('prompt')
        .notEmpty()
        .withMessage('Prompt is required')
        .isString()
        .withMessage('Prompt must be a string')
        .trim()
        .escape(),
    body('maxTokens')
        .optional()
        .isInt({ min: 1, max: 2000 })
        .withMessage('maxTokens must be between 1 and 2000')
        .toInt(),
];
const isProduction = process.env.NODE_ENV === 'production';
// Route for generating AI response with CSRF protection
router.post('/generate', apiLimiter, verifyCsrfToken, validateGenerate, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { prompt, maxTokens = 150 } = req.body;
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
        });
        // Handle the case where content could be null
        const aiMessage = response.choices[0].message?.content ?? ''; // Assign an empty string if null
        if (aiMessage.trim()) {
            res.json({ result: aiMessage });
        }
        else {
            res.status(500).json({ error: 'AI did not return a message.' });
        }
    }
    catch (error) {
        if (isProduction) {
            res.status(500).send('Error generating response');
        }
        else {
            res.status(500).send(`Error generating response: ${error.message}`);
        }
    }
});
export default router;
