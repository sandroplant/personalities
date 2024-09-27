import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Verify that the OPENAI_API_KEY is set
if (!process.env.OPENAI_API_KEY) {
  console.error(
    'Error: OPENAI_API_KEY is not set in the environment variables.'
  );
  process.exit(1); // Exit the application if API key is missing
} else {
  console.log('OPENAI_API_KEY is set:', process.env.OPENAI_API_KEY); // Add this line to verify
}

// OpenAI API Configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Your OpenAI API key
});

async function testOpenAI() {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Using gpt-3.5-turbo
      messages: [{ role: 'user', content: 'Hello, OpenAI!' }],
      max_tokens: 50 // Limit response to 50 tokens to reduce quota usage
    });
    console.log('AI Response:', response.choices[0].message.content.trim());
  } catch (error) {
    if (error.response) {
      // API error with status code
      console.error(
        `Error fetching AI response: ${error.response.status} - ${error.response.data.error.message}`
      );
    } else {
      // Other errors
      console.error('Error fetching AI response:', error.message);
    }
  }
}

testOpenAI();
