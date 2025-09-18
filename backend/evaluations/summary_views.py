from __future__ import annotations

from django.conf import settings
from django.db.models import (
    Avg,
    Case,
    Count,
    ExpressionWrapper,
    F,
    FloatField,
    Value,
    When,
)
from django.db.models.functions import Coalesce
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Criterion, Evaluation  # noqa: F401 (used via F-expressions)


class EvaluationSummaryV2View(APIView):
    """
    Weighted summary over evaluations per subject/criterion.

    Weight = rel_weight * ext_weight * fam_weight
      - rel_weight = rater_stats.reliability (defaults 1.0)
      - ext_weight = 0.7 if rater_stats.extreme_rate > 0.25 else 1.0 (defaults 1.0)
      - fam_weight = 1.0 (no familiarity field in current schema)

    Rows with raw_count < settings.EVALUATIONS_MIN_RATINGS are excluded.
    """

    @method_decorator(cache_page(30))  # light caching
    def get(self, request):
        # Infer field names used by Evaluation
        subject_field = "subject"
        rater_field = "evaluator"
        criterion_field = "criterion"
        score_field = "score"

        min_ratings = int(getattr(settings, "EVALUATIONS_MIN_RATINGS", 10))

        # Base queryset
        qs = Evaluation.objects.all()

        # Weights (gracefully degrade if no RaterStats)
        fam_weight = Value(1.0)
        rel_weight = Value(1.0)
        ext_weight = Value(1.0)
        try:
            # If RaterStats exists and is related at evaluator.rater_stats
            rel_weight = Coalesce(
                F(f"{rater_field}__rater_stats__reliability"), Value(1.0)
            )
            # piecewise: heavy downweight if extreme_rate > 0.25
            ext_weight = Case(
                When(
                    **{f"{rater_field}__rater_stats__extreme_rate__gt": 0.25},
                    then=Value(0.7),
                ),
                default=Value(1.0),
                output_field=FloatField(),
            )
        except Exception:
            # No rater stats available in this environment; keep defaults
            pass

        final_weight_expr = ExpressionWrapper(
            fam_weight * rel_weight * ext_weight, output_field=FloatField()
        )
        weighted_score_expr = ExpressionWrapper(
            F(score_field) * final_weight_expr, output_field=FloatField()
        )

        # Aggregate by subject + criterion
        agg = (
            qs.values(f"{subject_field}_id", f"{criterion_field}_id")
            .annotate(
                raw_count=Count("id"),  # ← real count of rows
                weighted_sum=Avg(weighted_score_expr),
                weight_mean=Avg(final_weight_expr),
            )
            .order_by()
        )

        # Gate by minimum ratings
        agg = agg.filter(raw_count__gte=min_ratings)

        # Build response payload
        result = []
        for row in agg:
            subj_id = row[f"{subject_field}_id"]
            crit_id = row[f"{criterion_field}_id"]
            weighted_sum = float(row.get("weighted_sum") or 0.0)

            # Because we took Avg(weighted_score), this is already a weighted average
            weighted_avg = weighted_sum

            result.append(
                {
                    "subject_id": subj_id,
                    "criterion_id": crit_id,
                    "weighted_average": round(weighted_avg, 3),
                    "raw_count": int(row.get("raw_count") or 0),
                }
            )

        gating = {
            "eligible": sum(1 for r in result if r["raw_count"] >= min_ratings),
            "threshold": min_ratings,
            "outbound_count": len(result),
        }

        return Response({"results": result, "gating": gating})
