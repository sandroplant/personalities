import 'dotenv/config';
import express from 'express';
import { body, validationResult } from 'express-validator';
import OpenAI from 'openai';
import rateLimit from 'express-rate-limit';
import verifyCsrfToken from '../middleware/verifyCsrfToken.js';
const router = express.Router();
if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is missing in environment variables');
}
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
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
        const aiMessage = response.choices[0].message?.content ?? '';
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
