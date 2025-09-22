"""Models supporting the activity feed service."""

from __future__ import annotations

from django.conf import settings
from django.db import models


class FeedEvent(models.Model):
    """Persisted activity that can appear in a user's feed."""

    class EventType(models.TextChoices):
        QUESTION = "question", "Question"
        ANSWER = "answer", "Answer"
        REACTION = "reaction", "Reaction"

    event_type = models.CharField(max_length=20, choices=EventType.choices)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="feed_events",
    )
    question = models.ForeignKey(
        "questions.Question",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="feed_events",
    )
    answer = models.ForeignKey(
        "questions.Answer",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="feed_events",
    )
    comment = models.ForeignKey(
        "posts.Comment",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="feed_events",
    )
    tag = models.ForeignKey(
        "questions.Tag",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="feed_events",
    )
    base_score = models.FloatField(default=1.0)
    quality_score = models.FloatField(default=1.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:  # pragma: no cover - debug helper
        return f"FeedEvent<{self.pk}:{self.event_type}>"
