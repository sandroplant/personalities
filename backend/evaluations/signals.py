from django.dispatch import Signal, receiver
from .models import Evaluation

# Custom signal triggered when an evaluation submission is complete
# and rater statistics have been calculated.
evaluation_submitted = Signal()


@receiver(evaluation_submitted)
def compute_weights_and_objectivity(sender, evaluation, **kwargs):
    """Compute reliability/extreme-rate weights and objectivity score."""
    mean = evaluation.rater_mean or 0
    stddev = evaluation.rater_stddev or 0
    reliability = 1 / (1 + stddev)
    extreme_rate = 1 - abs(mean - 3) / 2  # assumes 1-5 score scale
    extreme_rate = max(0, min(1, extreme_rate))
    objectivity = reliability * extreme_rate
    Evaluation.objects.filter(pk=evaluation.pk).update(
        reliability_weight=reliability,
        extreme_rate_weight=extreme_rate,
        objectivity_score=objectivity,
        pending=False,
    )
