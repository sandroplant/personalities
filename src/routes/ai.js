// /src/routes/ai.js

const express = require('express');
const router = express.Router();
const { Configuration, OpenAIApi } = require('openai');

// OpenAI API Configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your .env file
});
const openai = new OpenAIApi(configuration);

// AI Response Endpoint
router.post('/get-response', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ success: false, message: 'Invalid messages format.' });
  }

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: messages,
    });

    const aiMessage = completion.data.choices[0].message.content;
    res.json({ success: true, aiMessage });
  } catch (error) {
    console.error('Error fetching AI response:', error);
    res.status(500).json({ success: false, message: 'AI service error' });
  }
});

module.exports = router;
