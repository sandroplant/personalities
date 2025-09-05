from django.conf import settings
from django.db import models


class RaterStats(models.Model):
    """Per-rater statistics used for debiasing and reliability weighting."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="rater_stats")
    ratings_count = models.PositiveIntegerField(default=0)
    mean_score = models.FloatField(default=0.0)
    std_score = models.FloatField(default=0.0)
    extreme_rate = models.FloatField(default=0.0)  # fraction in {1,10}
    reliability = models.FloatField(default=1.0)   # mapped to [0.5,1.0]
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'evaluations'
        indexes = [
            models.Index(fields=["ratings_count"]),
        ]

