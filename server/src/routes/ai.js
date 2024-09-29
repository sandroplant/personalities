import 'dotenv/config';
import express from 'express';
import { body, validationResult } from 'express-validator';
import OpenAI from 'openai'; // Updated OpenAI SDK import

const router = express.Router();

// Initialize OpenAI with the API key from the environment variables
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Ensure this key is set in server/.env
});

// Input validation and sanitization
const validateGenerate = [
    body('prompt').notEmpty().withMessage('Prompt is required').trim().escape(),
];

// Example route using Express for AI response generation
router.post('/generate', validateGenerate, async (req, res) => {
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

        res.json({ result: response.choices[0].message.content });
    } catch (error) {
        console.error(
            'OpenAI API error:',
            error.response ? error.response.data : error.message
        );
        res.status(500).send('Error generating response');
    }
});

export default router;