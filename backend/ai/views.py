import os

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

import openai
from rest_framework import status
from rest_framework.decorators import api_view

# Fetch the key from settings or fall back to OS environment
openai_api_key = getattr(settings, "OPENAI_API_KEY", None) or os.getenv("OPENAI_API_KEY")
if openai_api_key:
    openai.api_key = openai_api_key


@csrf_exempt  # CSRF exemption for API purposes; adjust based on security needs
@api_view(["POST"])
def generate_ai_response(request):
    # Validate request data
    prompt = request.data.get("prompt")
    max_tokens = request.data.get("maxTokens", 150)

    if not prompt or not isinstance(prompt, str):
        return JsonResponse(
            {"error": "Prompt is required and must be a string."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Return a clear error if the key is missing
    if not openai_api_key:
        return JsonResponse(
            {"error": "OpenAI API key is missing in environment variables."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Call OpenAI API
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
        )

        ai_message = response.choices[0].message.get("content", "").strip()
        return JsonResponse({"result": ai_message})

    except Exception as e:
        error_message = str(e)
        return JsonResponse(
            {"error": f"Error generating response: {error_message}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
