from __future__ import annotations

from typing import Dict, Iterable, Tuple

from django.db.models import Avg, Q
from django.db.models.signals import post_delete, post_save
from django.dispatch import Signal, receiver

from .models import Evaluation

Pair = Tuple[int, int]

# Signal emitted when an evaluation is intentionally submitted via the API.
evaluation_submitted = Signal()


def _build_consensus_map(pairs: Iterable[Pair]) -> Dict[Pair, float]:
    """Return a mapping of (subject_id, criterion_id) -> average score."""

    query = Q()
    for subject_id, criterion_id in pairs:
        if subject_id is None or criterion_id is None:  # pragma: no cover - defensive
            continue
        query |= Q(subject_id=subject_id, criterion_id=criterion_id)

    if not query:
        return {}

    rows = Evaluation.objects.filter(query).values("subject_id", "criterion_id").annotate(avg=Avg("score"))

    return {(int(row["subject_id"]), int(row["criterion_id"])): float(row["avg"]) for row in rows}


def _compute_weights_for_rater(rater_id: int) -> None:
    """Recompute reliability/extreme-rate weights for every evaluation by a rater."""

    rater_evaluations = list(Evaluation.objects.filter(evaluator_id=rater_id))
    if not rater_evaluations:
        return

    pairs = {
        (ev.subject_id, ev.criterion_id)
        for ev in rater_evaluations
        if ev.subject_id is not None and ev.criterion_id is not None
    }
    consensus_map = _build_consensus_map(pairs)

    deviations: list[float] = []
    total_scores = 0
    extreme_scores = 0

    for ev in rater_evaluations:
        key = (ev.subject_id, ev.criterion_id)
        consensus = consensus_map.get(key)
        if consensus is None:
            continue

        score = float(ev.score)
        deviations.append(abs(score - consensus))
        total_scores += 1
        if score <= 1.0 or score >= 5.0:
            extreme_scores += 1

    if not total_scores:
        reliability_weight = 1.0
        extreme_rate_weight = 1.0
    else:
        avg_deviation = sum(deviations) / len(deviations) if deviations else 0.0
        reliability_weight = 1.0 / (1.0 + avg_deviation)
        reliability_weight = max(0.2, min(1.0, reliability_weight))

        extreme_frequency = extreme_scores / float(total_scores)
        extreme_rate_weight = 1.0 - 0.5 * extreme_frequency
        extreme_rate_weight = max(0.5, min(1.0, extreme_rate_weight))

    objectivity = reliability_weight * extreme_rate_weight

    Evaluation.objects.filter(evaluator_id=rater_id).update(
        reliability_weight=reliability_weight,
        extreme_rate_weight=extreme_rate_weight,
        objectivity_score=objectivity,
        pending=False,
    )
def _handle_weight_refresh(instance: Evaluation) -> None:
    """Shared helper to refresh rater weights for a saved evaluation."""

    if instance.subject_id is None or instance.criterion_id is None:
        return

    affected_rater_ids = (
        Evaluation.objects.filter(subject_id=instance.subject_id, criterion_id=instance.criterion_id)
        .values_list("evaluator_id", flat=True)
        .distinct()
    )

    for rater_id in affected_rater_ids:
        if rater_id is None:
            continue
        _compute_weights_for_rater(int(rater_id))


@receiver(post_save, sender=Evaluation)
def update_rater_weights(sender, instance: Evaluation, created: bool, **kwargs) -> None:
    """Whenever an evaluation is saved, update weights for affected raters."""

    _handle_weight_refresh(instance)


@receiver(evaluation_submitted)
def update_rater_weights_on_submission(sender, evaluation: Evaluation, **kwargs) -> None:
    """Refresh rater weights when the manual signal is emitted."""

    _handle_weight_refresh(evaluation)


@receiver(post_delete, sender=Evaluation)
def update_rater_weights_on_delete(sender, instance: Evaluation, **kwargs) -> None:
    """When an evaluation is deleted, recompute weights for relevant raters."""
    if instance.subject_id is None or instance.criterion_id is None:
        return

    # Recompute for the rater of the deleted row (if any)
    if instance.evaluator_id is not None:
        _compute_weights_for_rater(int(instance.evaluator_id))

    # Also recompute for any other raters who have remaining evals on this subject/criterion
    affected_rater_ids = (
        Evaluation.objects.filter(subject_id=instance.subject_id, criterion_id=instance.criterion_id)
        .values_list("evaluator_id", flat=True)
        .distinct()
    )
    for rater_id in affected_rater_ids:
        if rater_id is None:
            continue
        _compute_weights_for_rater(int(rater_id))
