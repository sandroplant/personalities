import logging
import os

import openai
from dotenv import load_dotenv

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables from the .env file
# First attempt to load from the backend directory, then fallback to root .env if needed
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))  # Adjust this path if needed

# Set the API key
openai.api_key = os.getenv("OPENAI_API_KEY")

# Verify that the OPENAI_API_KEY is set
if not openai.api_key:
    logger.error("Error: OPENAI_API_KEY is not set in the environment variables.")
    exit(1)
else:
    logger.info("OPENAI_API_KEY is set")  # Avoid logging the actual key for security


def test_openai():
    try:
        # Make the OpenAI API call
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello, OpenAI!"},
            ],
            max_tokens=50,
        )

        # Retrieve the AI message content from the response
        ai_message = (
            response["choices"][0]["message"]["content"].strip() if response["choices"] else "No content returned"
        )

        if ai_message:
            logger.info("AI Response: %s", ai_message)
        else:
            logger.info("AI did not return a message.")
    except openai.OpenAIError as e:
        logger.error(f"OpenAI API error: {e}")
    except Exception as error:
        logger.error(f"Unexpected error: {error}")


# Run the function
if __name__ == "__main__":
    test_openai()
