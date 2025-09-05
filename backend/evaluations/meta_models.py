from django.db import models


class EvaluationMeta(models.Model):
    """Holds gating status for an Evaluation without altering the core model.

    This allows deploying status gating additively. Summary queries may filter
    by evaluationmeta__status='ACTIVE' once migrations are applied.
    """

    STATUS_PENDING = 'PENDING'
    STATUS_ACTIVE = 'ACTIVE'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_ACTIVE, 'Active'),
    ]

    evaluation = models.OneToOneField(
        'evaluations.Evaluation', on_delete=models.CASCADE, related_name='evaluationmeta'
    )
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'evaluations'
        indexes = [
            models.Index(fields=['status']),
        ]

