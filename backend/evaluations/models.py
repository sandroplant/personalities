from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class Criterion(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Evaluation(models.Model):
    evaluator = models.ForeignKey(
        User, related_name="given_evaluations", on_delete=models.CASCADE
    )
    subject = models.ForeignKey(
        User, related_name="received_evaluations", on_delete=models.CASCADE
    )
    criterion = models.ForeignKey(Criterion, on_delete=models.CASCADE)
    score = models.PositiveSmallIntegerField()
    familiarity = models.PositiveSmallIntegerField(null=True, blank=True)
    normalized_score = models.FloatField(null=True, blank=True)
    pending = models.BooleanField(default=True)
    rater_mean = models.FloatField(null=True, blank=True)
    rater_stddev = models.FloatField(null=True, blank=True)
    reliability_weight = models.FloatField(null=True, blank=True)
    extreme_rate_weight = models.FloatField(null=True, blank=True)
    objectivity_score = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.subject} rated by {self.evaluator} on {self.criterion}"


# Codex CLI: ensure additive models register with this app
try:
    from .meta_models import EvaluationMeta  # noqa: F401
    from .rater_models import RaterStats  # noqa: F401
except Exception:
    pass
