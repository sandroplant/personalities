import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ImproperlyConfigured
from rest_framework.decorators import api_view
from rest_framework import status
import openai  # Import OpenAI module

# Ensure OpenAI API key is present
openai_api_key = os.getenv('OPENAI_API_KEY')  # Load the API key from environment variables
if not openai_api_key:
    raise ImproperlyConfigured('OpenAI API key is missing in environment variables')

# Set the OpenAI API key (this step is necessary for authenticating requests)
openai.api_key = openai_api_key

@csrf_exempt  # CSRF exemption for API purposes; adjust based on security needs
@api_view(['POST'])
def generate_ai_response(request):
    # Validate request data
    prompt = request.data.get('prompt')
    max_tokens = request.data.get('maxTokens', 150)

    if not prompt or not isinstance(prompt, str):
        return JsonResponse(
            {'error': 'Prompt is required and must be a string.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Call OpenAI API
    try:
        # Use OpenAI's API to generate a response based on the prompt
        response = openai.ChatCompletion.create(
            model='gpt-3.5-turbo',
            messages=[{'role': 'user', 'content': prompt}],
            max_tokens=max_tokens
        )

        # Extract the AI-generated message from the response
        ai_message = response.choices[0].message.get('content', '').strip()

        return JsonResponse({'result': ai_message})

    except Exception as e:
        error_message = str(e)
        return JsonResponse(
            {'error': f'Error generating response: {error_message}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
