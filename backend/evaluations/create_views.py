from typing import Optional
import os

from django.apps import apps
from django.db import transaction
from django.db.models import Count
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .meta_models import EvaluationMeta
from .summary_views import _pick_fk_field, _pick_numeric_field


def _get_model(app_label: str, model_name: str):
    try:
        return apps.get_model(app_label, model_name)
    except Exception:
        return None


class EvaluationCreateV2View(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        Evaluation = _get_model('evaluations', 'Evaluation')  # type: ignore
        Criterion = _get_model('evaluations', 'Criterion') or _get_model('evaluations', 'EvaluationCriterion')  # type: ignore
        if Evaluation is None or Criterion is None:
            return Response({"detail": "Evaluation models not available"}, status=500)

        try:
            subject_id = int(request.query_params.get("subject_id", ""))
        except Exception:
            return Response({"detail": "subject_id query param is required"}, status=400)

        criterion_id = request.data.get("criterion_id")
        score_val = request.data.get("score")
        familiarity_val = request.data.get("familiarity")
        if not criterion_id or score_val is None:
            return Response({"detail": "criterion_id and score are required"}, status=400)

        # Dynamically resolve field names
        subject_field = _pick_fk_field(Evaluation, ["subject", "target", "rated_user", "profile", "user"])
        rater_field = _pick_fk_field(Evaluation, ["rater", "evaluator", "author", "user"])
        criterion_field = _pick_fk_field(Evaluation, ["criterion", "criteria"])
        score_field = _pick_numeric_field(Evaluation, ["score", "rating", "value", "val", "points"]) 
        familiarity_field = _pick_numeric_field(Evaluation, ["familiarity", "weight", "confidence"])  # optional
        if not subject_field or not rater_field or not criterion_field or not score_field:
            return Response({"detail": "Evaluation model fields could not be inferred."}, status=500)

        # Validate criterion exists
        try:
            Criterion.objects.get(pk=criterion_id)
        except Criterion.DoesNotExist:
            return Response({"detail": "criterion_id not found"}, status=404)

        # Create evaluation instance
        payload = {
            f"{subject_field}_id": subject_id,
            f"{rater_field}_id": request.user.id,
            f"{criterion_field}_id": criterion_id,
            score_field: score_val,
        }
        if familiarity_field and familiarity_val is not None:
            payload[familiarity_field] = familiarity_val

        ev = Evaluation.objects.create(**payload)

        # Participation gating for the SUBJECT (rated user): count their outbound ratings
        outbound_count = Evaluation.objects.filter(**{f"{rater_field}_id": subject_id}).count()
        try:
            min_outbound = int(os.environ.get("DJANGO_EVAL_MIN_OUTBOUND", "10"))
        except ValueError:
            min_outbound = 10
        status_value = EvaluationMeta.STATUS_ACTIVE if outbound_count >= min_outbound else EvaluationMeta.STATUS_PENDING
        EvaluationMeta.objects.create(evaluation=ev, status=status_value)

        return Response({
            "id": ev.pk,
            "status": status_value,
        }, status=201)
