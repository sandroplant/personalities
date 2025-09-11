from django.db import models
from django.contrib.auth import get_user_model

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

    class Meta:
        unique_together = ("evaluator", "subject", "criterion")

    def __str__(self):
        return f"{self.subject} rated by {self.evaluator} on {self.criterion}"
