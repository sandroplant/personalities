from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class Criterion(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Evaluation(models.Model):
    evaluator = models.ForeignKey(User, related_name="given_evaluations", on_delete=models.CASCADE)
    subject = models.ForeignKey(User, related_name="received_evaluations", on_delete=models.CASCADE)
    criterion = models.ForeignKey(Criterion, on_delete=models.CASCADE)
    score = models.PositiveSmallIntegerField()
    familiarity = models.PositiveSmallIntegerField(null=True, blank=True)
    normalized_score = models.FloatField(null=True, blank=True)
    comment = models.TextField(blank=True)
    comment_is_anonymous = models.BooleanField(default=True)
    self_awareness_flag = models.BooleanField(
        default=False,
        help_text="Evaluator indicated they reflected on potential personal bias.",
    )
    expected_peer_score = models.FloatField(
        null=True,
        blank=True,
        help_text="Evaluator prediction for how others will rate this subject on the same criterion.",
    )
    divergence_comment = models.TextField(
        blank=True,
        help_text="Optional context supporting the evaluator's divergence awareness estimate.",
    )
    pending = models.BooleanField(default=True)
    rater_mean = models.FloatField(null=True, blank=True)
    rater_stddev = models.FloatField(null=True, blank=True)
    reliability_weight = models.FloatField(null=True, blank=True)
    extreme_rate_weight = models.FloatField(null=True, blank=True)
    objectivity_score = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.subject} rated by {self.evaluator} on {self.criterion}"


# Follow-up clarification workflow ---------------------------------------


class ClarificationThread(models.Model):
    evaluation = models.ForeignKey(
        Evaluation,
        related_name="clarification_threads",
        on_delete=models.CASCADE,
    )
    subject = models.ForeignKey(
        User,
        related_name="clarification_threads_as_subject",
        on_delete=models.CASCADE,
    )
    evaluator = models.ForeignKey(
        User,
        related_name="clarification_threads_as_evaluator",
        on_delete=models.CASCADE,
    )
    pending_response = models.BooleanField(default=False)
    is_closed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:  # pragma: no cover - string repr for admin/debugging
        return f"Clarification thread for evaluation {self.evaluation_id}"


class ClarificationMessage(models.Model):
    ROLE_SUBJECT = "subject"
    ROLE_EVALUATOR = "evaluator"
    ROLE_SYSTEM = "system"
    ROLE_CHOICES = (
        (ROLE_SUBJECT, "Subject"),
        (ROLE_EVALUATOR, "Evaluator"),
        (ROLE_SYSTEM, "System"),
    )

    thread = models.ForeignKey(
        ClarificationThread,
        related_name="messages",
        on_delete=models.CASCADE,
    )
    sender_role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    body = models.TextField()
    is_anonymous = models.BooleanField(
        default=True,
        help_text="Whether the subject can see the identity of the evaluator for this message.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:  # pragma: no cover - debug helper
        return f"{self.get_sender_role_display()} message in thread {self.thread_id}"


# Codex CLI: ensure additive models register with this app
try:
    from .meta_models import EvaluationMeta  # noqa: F401
    from .rater_models import RaterStats  # noqa: F401
except Exception:
    pass
