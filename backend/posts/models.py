# posts/models.py

from django.conf import settings
from django.db import models


class Post(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="posts",
    )
    title = models.CharField(max_length=255)
    content = models.TextField()
    likes = models.PositiveIntegerField(default=0)
    shares = models.PositiveIntegerField(default=0)
    tags = models.JSONField(default=list, blank=True)
    external_urls = models.JSONField(default=dict, blank=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="post_comments",
    )
    content = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)
    quality_score = models.FloatField(default=0.0)
    agreement_score = models.FloatField(default=0.0)
    humor_score = models.FloatField(default=0.0)
    safety_score = models.FloatField(default=0.0)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Comment by {self.author} on {self.post}"


class CommentReaction(models.Model):
    class ReactionValue(models.IntegerChoices):
        NEGATIVE = -1, "negative"
        NEUTRAL = 0, "neutral"
        POSITIVE = 1, "positive"

    DIMENSIONS = ("quality", "agreement", "humor", "safety")

    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name="reactions")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="comment_reactions",
    )
    quality = models.SmallIntegerField(choices=ReactionValue.choices, default=ReactionValue.NEUTRAL)
    agreement = models.SmallIntegerField(choices=ReactionValue.choices, default=ReactionValue.NEUTRAL)
    humor = models.SmallIntegerField(choices=ReactionValue.choices, default=ReactionValue.NEUTRAL)
    safety = models.SmallIntegerField(choices=ReactionValue.choices, default=ReactionValue.NEUTRAL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("comment", "user")

    def __str__(self):  # pragma: no cover - debugging helper
        return f"Reaction by {self.user} on comment {self.comment_id}"
