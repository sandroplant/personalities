"""Database models supporting the in-app economy system."""

from __future__ import annotations

from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils import timezone


class CoinBalance(models.Model):
    """Tracks the current coin balance for a user."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="coin_balance",
    )
    coins = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Coin balance"
        verbose_name_plural = "Coin balances"

    def __str__(self) -> str:  # pragma: no cover - repr helper
        return f"{self.user} → {self.coins} coins"


class CoinTransaction(models.Model):
    """A single credit/debit applied to a user's balance."""

    class EventType(models.TextChoices):
        QUESTION_CREATED = "question_created", "Question created"
        ANSWER_SUBMITTED = "answer_submitted", "Answer submitted"
        EVALUATION_RECEIVED = "evaluation_received", "Evaluation received"
        EVALUATION_GIVEN = "evaluation_given", "Evaluation given"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="coin_transactions",
    )
    amount = models.IntegerField(help_text="Positive values credit coins; negative values deduct coins.")
    event_type = models.CharField(max_length=64, choices=EventType.choices)
    reason = models.CharField(max_length=255)
    reference_id = models.CharField(
        max_length=64,
        blank=True,
        null=True,
        help_text="External identifier to ensure idempotency (e.g., question/answer/evaluation id).",
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            # DB-level idempotency when a reference_id is present
            models.UniqueConstraint(
                fields=["event_type", "reference_id"],
                condition=Q(reference_id__isnull=False),
                name="unique_economy_event_reference",
            )
        ]
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["event_type"]),
        ]

    def __str__(self) -> str:  # pragma: no cover - repr helper
        return f"{self.user} {self.amount:+} for {self.get_event_type_display()}"


class ReputationMetric(models.Model):
    """Stores derived reputation metrics calculated from transactions."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reputation_metric",
    )
    score = models.FloatField(default=0.0)
    momentum = models.FloatField(default=0.0, help_text="Derivative of recent reputation change.")
    last_recalculated = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = "Reputation metric"
        verbose_name_plural = "Reputation metrics"

    def __str__(self) -> str:  # pragma: no cover - repr helper
        return f"{self.user} reputation={self.score:.2f}"
