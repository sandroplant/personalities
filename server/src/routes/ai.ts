// server/routes/ai.ts

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import OpenAI from 'openai'; // Ensure OpenAI has TypeScript support or use a compatible package

const router = express.Router();

// Initialize OpenAI with the API key from the environment variables
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY as string, // Cast to string
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
];

// Define an interface for the OpenAI response if necessary
interface AIResponse {
    result: string;
}

// Example route using Express for AI response generation
router.post(
    '/generate',
    validateGenerate,
    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { prompt } = req.body;

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo', // or any other model you have access to
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 150, // Set token limit to control response length
            });

            const aiMessage = response.choices[0].message?.content.trim();
            if (aiMessage) {
                const result: AIResponse = { result: aiMessage };
                res.json(result);
            } else {
                res.status(500).json({ error: 'AI did not return a message.' });
            }
        } catch (error: any) {
            console.error(
                'OpenAI API error:',
                error.response ? error.response.data : error.message
            );
            res.status(500).send('Error generating response');
        }
    }
);

export default router;
