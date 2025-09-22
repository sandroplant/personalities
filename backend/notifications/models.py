"""Models for notification delivery and user preferences."""

from __future__ import annotations

from django.conf import settings
from django.db import models


class Notification(models.Model):
    """Represents a single notification to be delivered to a user."""

    class Type(models.TextChoices):
        NEW_ANSWER = "new_answer", "New Answer"
        NEW_COMMENT = "new_comment", "New Comment"
        EVALUATION_REQUEST = "evaluation_request", "Evaluation Request"
        COIN_CHANGE = "coin_change", "Coin Change"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    notification_type = models.CharField(max_length=32, choices=Type.choices)
    payload = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    is_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:  # pragma: no cover - debug helper
        return f"Notification<{self.user_id}:{self.notification_type}>"


class NotificationPreference(models.Model):
    """Stores opt-in/out state per notification type."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notification_preferences")
    notification_type = models.CharField(max_length=32, choices=Notification.Type.choices)
    enabled = models.BooleanField(default=True)

    class Meta:
        unique_together = ("user", "notification_type")

    def __str__(self) -> str:  # pragma: no cover - debug helper
        return f"Preference<{self.user_id}:{self.notification_type}={self.enabled}>"


class CoinBalance(models.Model):
    """Tracks a user's coin balance for gamified actions."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="coin_balance")
    balance = models.IntegerField(default=0)

    def __str__(self) -> str:  # pragma: no cover - debug helper
        return f"CoinBalance<{self.user_id}:{self.balance}>"
