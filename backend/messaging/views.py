import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework import status
from django.utils.decorators import method_decorator
from django.views import View
from functools import wraps
from .models import Message  # Adjust the import based on your Message model location
from django.db.models import Q
from core.utils.openai_service import get_openai_response


# Middleware for user authentication
def ensure_authenticated(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse(
                {"error": "User not authenticated"}, status=status.HTTP_401_UNAUTHORIZED
            )
        return view_func(request, *args, **kwargs)

    return _wrapped_view


@method_decorator(csrf_exempt, name="dispatch")
class MessagingView(View):
    @method_decorator(ensure_authenticated)
    @api_view(["POST"])
    def send_message(self, request):
        data = json.loads(request.body)
        sender_id = data.get("senderId")
        recipient_id = data.get("recipientId")
        content = data.get("content")
        include_ai = data.get("includeAI", False)

        # Perform AI logic if includeAI is True
        ai_response = get_openai_response(content) if include_ai else None

        try:
            new_message = Message(
                sender=sender_id,
                recipient=recipient_id,
                content=content,
                ai_response=ai_response,
            )
            new_message.save()
            return JsonResponse(
                {"message": "Message sent successfully!", "aiResponse": ai_response},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return JsonResponse(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @method_decorator(ensure_authenticated)
    @api_view(["GET"])
    def get_conversation(self, request, userId1, userId2):
        try:
            messages = Message.objects.filter(
                (Q(sender=userId1) & Q(recipient=userId2))
                | (Q(sender=userId2) & Q(recipient=userId1))
            ).order_by("timestamp")

            # Serialize the messages (you might want to create a serializer for this)
            messages_data = [
                message.serialize() for message in messages
            ]  # Assuming you have a serialize method
            return JsonResponse(messages_data, safe=False, status=status.HTTP_200_OK)
        except Exception as e:
            return JsonResponse(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @method_decorator(ensure_authenticated)
    @api_view(["POST"])
    def send_mystery_message(self, request):
        # Implement logic for sending mystery messages
        pass

    @method_decorator(ensure_authenticated)
    @api_view(["POST"])
    def start_call(self, request):
        # Implement logic for starting a call
        pass
