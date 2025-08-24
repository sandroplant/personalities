"""
Models for the questions app.  This module defines simple polling models
including Question, Answer, and Tag.  Each question belongs to a single
category (tag) and may have up to four answer options stored in a JSON
list.  Answers record which option a user selected and whether the
response is anonymous.
"""

from django.conf import settings
from django.db import models


class Tag(models.Model):
    """A simple categorization for questions (e.g. Politics, Religion)."""
    name = models.CharField(max_length=100, unique=True)

    def __str__(self) -> str:
        return self.name


class Question(models.Model):
    """A poll question posted by a user.

    A question includes free‐form text and up to four answer options.  If
    ``options`` is empty then the frontend should default to a simple
    yes/no poll.  The ``is_anonymous`` flag controls whether the
    asker's identity is hidden from other users.
    """

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="questions_author",
    )
    text = models.CharField(max_length=255)
    tag = models.ForeignKey(
        Tag,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="questions",
    )
    options = models.JSONField(default=list, blank=True)
    is_anonymous = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.text


class Answer(models.Model):
    """A user's answer to a question.

    ``selected_option_index`` stores the index of the chosen option in the
    question's ``options`` list.  For yes/no polls, index 0 represents
    “Yes” and index 1 represents “No”.  ``is_anonymous`` indicates
    whether the user's identity should be hidden when aggregating
    results.
    """

    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="answers",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="answers_user",
    )
    selected_option_index = models.PositiveIntegerField()
    is_anonymous = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("question", "user")

    def __str__(self) -> str:
        return f"Answer by {self.user} to {self.question}"  # pragma: no cover
