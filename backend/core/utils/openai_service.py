# core/utils/openai_service.py

import os
import openai
from .logger import logger

openai.api_key = os.getenv('OPENAI_API_KEY')

def get_openai_response(prompt):
    try:
        response = openai.Completion.create(
            engine="text-davinci-003",  # Choose the appropriate engine
            prompt=prompt,
            max_tokens=150
        )
        return response.choices[0].text.strip()
    except Exception as e:
        logger.error("❌ OpenAI API error:", exc_info=True)
        return None
