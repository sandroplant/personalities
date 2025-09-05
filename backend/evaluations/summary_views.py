from typing import Any, Dict, List, Optional, Tuple
import os

from django.contrib.auth import get_user_model
from django.apps import apps
from django.core.cache import cache
from django.db.models import Avg, Count, F, FloatField, Sum, ExpressionWrapper
from django.http import Http404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Evaluation  # type: ignore


def _pick_fk_field(model, preferred_names: List[str]) -> Optional[str]:
    fields = {f.name: f for f in model._meta.get_fields() if getattr(f, "is_relation", False)}
    # Prefer exact name matches
    for name in preferred_names:
        if name in fields:
            return name
    # Fallback: heuristic by substring
    for name in fields:
        for pref in preferred_names:
            if pref in name:
                return name
    return None


def _pick_numeric_field(model, preferred_names: List[str]) -> Optional[str]:
    for f in model._meta.get_fields():
        # numeric fields usually have get_internal_type like 'IntegerField'/'FloatField'
        if hasattr(f, "get_internal_type") and f.get_internal_type() in (
            "IntegerField",
            "SmallIntegerField",
            "PositiveIntegerField",
            "PositiveSmallIntegerField",
            "BigIntegerField",
            "FloatField",
            "DecimalField",
        ):
            if f.name in preferred_names:
                return f.name
    # fallback by substring
    for f in model._meta.get_fields():
        if hasattr(f, "get_internal_type") and f.get_internal_type() in (
            "IntegerField",
            "SmallIntegerField",
            "PositiveIntegerField",
            "PositiveSmallIntegerField",
            "BigIntegerField",
            "FloatField",
            "DecimalField",
        ):
            for pref in preferred_names:
                if pref in f.name:
                    return f.name
    return None


class EvaluationSummaryV2View(APIView):
    """Return aggregated evaluation summary per criterion for a subject.

    Response schema:
    {
      "subject_id": <int>,
      "criteria": [
        {"id": <int>, "name": <str>, "average": <float>, "count": <int>},
        ...
      ]
    }
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            subject_id = int(request.query_params.get("subject_id", ""))
        except (TypeError, ValueError):
            return Response({"detail": "subject_id query param is required and must be an integer."}, status=400)

        cache_key = f"eval_summary_v2:{subject_id}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        # Dynamically infer field names to avoid coupling to exact model naming
        subject_field = _pick_fk_field(Evaluation, ["subject", "target", "rated_user", "profile", "user"])
        criterion_field = _pick_fk_field(Evaluation, ["criterion", "criteria"])
        score_field = _pick_numeric_field(Evaluation, ["score", "rating", "value"])
        weight_field = _pick_numeric_field(Evaluation, ["familiarity", "weight", "confidence"])  # optional
        rater_field = _pick_fk_field(Evaluation, ["rater", "evaluator", "author"])

        if not subject_field or not criterion_field or not score_field:
            return Response({"detail": "Evaluation model fields could not be inferred."}, status=500)

        # Build queryset filters and annotations dynamically
        qs = Evaluation.objects.all()
        qs = qs.filter(**{f"{subject_field}_id": subject_id})
        # If EvaluationMeta model exists, filter to ACTIVE only
        try:
            apps.get_model('evaluations', 'EvaluationMeta')
            qs = qs.filter(evaluationmeta__status='ACTIVE')
        except Exception:
            pass

        # Participation gating: require subject to have at least MIN_OUTBOUND completed evaluations
        try:
            MIN_OUTBOUND = int(os.environ.get("DJANGO_EVAL_MIN_OUTBOUND", "10"))
        except ValueError:
            MIN_OUTBOUND = 10
        outbound_count = 0
        if rater_field:
            outbound_count = Evaluation.objects.filter(**{f"{rater_field}_id": subject_id}).count()
        eligible = outbound_count >= MIN_OUTBOUND
        if not eligible:
            result = {
                "subject_id": subject_id,
                "criteria": [],
                "gating": {
                    "eligible": False,
                    "threshold": MIN_OUTBOUND,
                    "outbound_count": outbound_count,
                },
            }
            cache.set(cache_key, result, 30)
            return Response(result)

        # Annotations
        # Build weight components: familiarity, reliability, extreme-rate downweight
        fam_weight = None
        if weight_field:
            fam_weight = F(weight_field)
        else:
            fam_weight = 1.0

        # Join rater stats if available
        rel_weight = 1.0
        ext_weight = 1.0
        try:
            apps.get_model('evaluations', 'RaterStats')
            # Coalesce to defaults if missing
            from django.db.models.functions import Coalesce
            from django.db.models import Value, Case, When
            if rater_field:
                rel_weight = Coalesce(F(f'{rater_field}__rater_stats__reliability'), Value(1.0))
                ext_rate = Coalesce(F(f'{rater_field}__rater_stats__extreme_rate'), Value(0.0))
                # Piecewise downweight for extreme raters (threshold 0.25 -> weight 0.7)
                ext_weight = Case(
                    When(ext_rate__gt=0.25, then=Value(0.7)),
                    default=Value(1.0),
                    output_field=FloatField(),
                )
        except Exception:
            pass

        # Compose final weight and weighted score
        final_weight_expr = ExpressionWrapper(fam_weight * rel_weight * ext_weight, output_field=FloatField())
        weighted_score_expr = ExpressionWrapper(F(score_field) * final_weight_expr, output_field=FloatField())
        values = {
            "criterion_id": F(f"{criterion_field}_id"),
            "criterion_name": F(f"{criterion_field}__name"),
        }

        # Attach rater stats join if available
        try:
            # rater_field is defined earlier
            qs = qs.select_related()  # no-op if nothing to select
            qs = qs.annotate(rater_id=F(f"{rater_field}_id")) if rater_field else qs
            qs = qs.select_related()  # keep api consistent
            # Join to RaterStats via user id; ORM join occurs when we reference rater_stats__*
        except Exception:
            pass

        base = qs.values("criterion_id", "criterion_name").annotate(
            rating_count=Count("id"),
            avg_score=Avg(score_field),
            sum_weighted=Sum(weighted_score_expr),
            sum_weight=Sum(final_weight_expr),
        )

        items: List[Dict[str, Any]] = []
        # Minimum number of ratings required to display a criterion row
        try:
            MIN_CRITERION = int(os.environ.get("DJANGO_EVAL_MIN_CRITERION", "10"))
        except ValueError:
            MIN_CRITERION = 10
        for row in base:
            count = int(row.get("rating_count") or 0)
            avg = float(row.get("avg_score") or 0.0)
            if weight_field and row.get("sum_weight"):
                sw = float(row.get("sum_weight") or 0.0)
                sws = float(row.get("sum_weighted") or 0.0)
                average = sws / sw if sw > 0 else avg
            else:
                average = avg
            if count < MIN_CRITERION:
                continue
            items.append({
                "id": int(row.get("criterion_id")),
                "name": row.get("criterion_name") or "",
                "average": round(average, 3),
                "count": count,
            })

        result = {
            "subject_id": subject_id,
            "criteria": sorted(items, key=lambda x: x["name"]),
            "gating": {
                "eligible": True,
                "threshold": MIN_OUTBOUND,
                "outbound_count": outbound_count,
            },
        }
        cache.set(cache_key, result, 60)  # 1 minute cache
        return Response(result)
