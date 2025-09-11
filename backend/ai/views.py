import os

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view
import openai  # openai==0.28.0


# Configure OpenAI once if a key is present; don't crash at import time.
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY


@csrf_exempt  # adjust based on your CSRF strategy
@api_view(["POST"])
def generate_ai_response(request):
    """
    POST JSON body:
      {
        "prompt": "Your question...",
        "maxTokens": 150   # optional, int
      }
    Returns: {"result": "..."} or {"error": "..."} with appropriate status code.
    """
    # Ensure API key is configured (fail fast per-request rather than at import)
    if not openai.api_key:
        return JsonResponse(
            {"error": "OPENAI_API_KEY is not configured on the server."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    # Validate prompt
    prompt = request.data.get("prompt")
    if not isinstance(prompt, str) or not prompt.strip():
        return JsonResponse(
            {"error": "Prompt is required and must be a non-empty string."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate maxTokens
    max_tokens_raw = request.data.get("maxTokens", 150)
    try:
        max_tokens = int(max_tokens_raw)
    except (TypeError, ValueError):
        return JsonResponse(
            {"error": "maxTokens must be an integer."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    # Clamp to a safe range for this endpoint
    max_tokens = max(1, min(max_tokens, 1024))

    try:
        # openai==0.28.0 uses ChatCompletion.create
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            temperature=0.7,
        )

        message = ""
        if getattr(response, "choices", None):
            message = (response.choices[0].message.get("content") or "").strip()

        return JsonResponse({"result": message})

    except Exception as e:
        return JsonResponse(
            {"error": f"Error generating response: {e}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
