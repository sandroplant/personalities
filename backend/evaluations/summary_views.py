from __future__ import annotations

from django.conf import settings
from django.db.models import Avg, Count, ExpressionWrapper, F, FloatField, Sum, Value
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
      - rel_weight = evaluation.reliability_weight (defaults 1.0)
      - ext_weight = evaluation.extreme_rate_weight (defaults 1.0)
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
        rel_weight = Coalesce(F("reliability_weight"), Value(1.0))
        ext_weight = Coalesce(F("extreme_rate_weight"), Value(1.0))

        final_weight_expr = ExpressionWrapper(fam_weight * rel_weight * ext_weight, output_field=FloatField())
        weighted_score_expr = ExpressionWrapper(F(score_field) * final_weight_expr, output_field=FloatField())

        # Aggregate by subject + criterion
        agg = (
            qs.values(f"{subject_field}_id", f"{criterion_field}_id")
            .annotate(
                raw_count=Count("id"),  # ← real count of rows
                weighted_sum=Sum(weighted_score_expr),
                weight_sum=Sum(final_weight_expr),
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
            weight_sum = float(row.get("weight_sum") or 0.0)

            weighted_avg = weighted_sum / weight_sum if weight_sum else 0.0

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
