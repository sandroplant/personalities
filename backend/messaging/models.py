# messaging/models.py

from django.conf import settings  # Import settings for AUTH_USER_MODEL
from django.db import models


class Message(models.Model):
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Updated to use AUTH_USER_MODEL
        on_delete=models.CASCADE,
        related_name="messaging_sent_messages",  # Updated related_name
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Updated to use AUTH_USER_MODEL
        on_delete=models.CASCADE,
        related_name="messaging_received_messages",  # Updated related_name
    )
    content = models.TextField(max_length=1000)
    ai_response = models.TextField(blank=True, max_length=2000)
    is_mystery_message = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Message from {self.sender} to {self.recipient}"
