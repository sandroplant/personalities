from __future__ import annotations

from django.db import models


class EvaluationMeta(models.Model):
    """
    One-to-one metadata for an Evaluation.
    Status is used to gate whether an evaluation should participate in summaries.
    """

    STATUS_PENDING = "PENDING"
    STATUS_ACTIVE = "ACTIVE"

    STATUS_CHOICES = (
        (STATUS_PENDING, "Pending"),
        (STATUS_ACTIVE, "Active"),
    )

    evaluation = models.OneToOneField(
        "evaluations.Evaluation",
        on_delete=models.CASCADE,
        related_name="evaluationmeta",  # so you can use evaluation.evaluationmeta
    )
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Evaluation Meta"
        verbose_name_plural = "Evaluation Meta"

    def __str__(self) -> str:
        return f"EvaluationMeta<{self.evaluation_id}:{self.status}>"
