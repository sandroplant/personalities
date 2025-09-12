from __future__ import annotations

from django.conf import settings
from django.db import models


class RaterStats(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="rater_stats",
    )
    ratings_count = models.PositiveIntegerField(default=0)
    mean_score = models.FloatField(default=0.0)
    std_score = models.FloatField(default=0.0)
    extreme_rate = models.FloatField(default=0.0)
    reliability = models.FloatField(default=0.0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Rater Stats"
        verbose_name_plural = "Rater Stats"

    def __str__(self) -> str:
        return f"RaterStats<{self.user_id}>"
