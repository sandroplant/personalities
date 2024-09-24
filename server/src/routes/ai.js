require('dotenv').config();
const express = require('express');
const router = express.Router();
const OpenAI = require('openai'); // Updated OpenAI SDK import

// Initialize OpenAI with the API key from the environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this key is set in server/.env
});

// Example route using Express for AI response generation
router.post('/generate', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // or any other model you have access to
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150, // Set token limit to control response length
    });

    res.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error('OpenAI API error:', error.response ? error.response.data : error.message);
    res.status(500).send('Error generating response');
  }
});

module.exports = router;
