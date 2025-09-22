"""Utility helpers for weighting and aggregating user reactions."""

from __future__ import annotations

from collections import defaultdict
from typing import Dict, Iterable, List, Sequence

from django.db.models import Avg


DIMENSIONS: Sequence[str] = ("quality", "agreement", "humor", "safety")


def _default_weight_map(user_ids: Iterable[int]) -> Dict[int, float]:
    """Return a mapping of user_id -> reliability weight using evaluations data."""

    ids: List[int] = [int(uid) for uid in user_ids if uid is not None]
    if not ids:
        return {}

    from evaluations.models import Evaluation  # imported lazily to avoid circular imports

    rows = (
        Evaluation.objects.filter(evaluator_id__in=ids, objectivity_score__isnull=False)
        .values("evaluator_id")
        .annotate(avg=Avg("objectivity_score"))
    )
    weights = {int(row["evaluator_id"]): float(row["avg"]) for row in rows}
    return {uid: weights.get(uid, 1.0) for uid in ids}


def compute_weighted_scores(rows: Iterable[Dict[str, int]], *, user_ids: Iterable[int]) -> Dict[str, float]:
    """Compute weighted averages for each reaction dimension given raw rows."""

    weights = _default_weight_map(user_ids)
    totals: Dict[str, float] = defaultdict(float)
    weight_sums: Dict[str, float] = defaultdict(float)

    for row in rows:
        uid = int(row["user_id"])
        weight = float(weights.get(uid, 1.0))
        for field in DIMENSIONS:
            value = row.get(field)
            if value is None:
                continue
            totals[field] += weight * float(value)
            weight_sums[field] += weight

    return {
        field: (totals[field] / weight_sums[field] if weight_sums[field] else 0.0) for field in DIMENSIONS
    }


def build_breakdown(rows: Iterable[Dict[str, int]]) -> Dict[str, Dict[str, int]]:
    """Return simple positive/neutral/negative counts for each dimension."""

    breakdown: Dict[str, Dict[str, int]] = {}
    for field in DIMENSIONS:
        breakdown[field] = {"positive": 0, "neutral": 0, "negative": 0}

    for row in rows:
        for field in DIMENSIONS:
            value = row.get(field)
            if value is None:
                continue
            if value > 0:
                breakdown[field]["positive"] += 1
            elif value < 0:
                breakdown[field]["negative"] += 1
            else:
                breakdown[field]["neutral"] += 1

    return breakdown
