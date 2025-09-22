from __future__ import annotations

from django.apps import apps
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .meta_models import EvaluationMeta

# Prefer helpers from summary_views if exported there; otherwise use local fallbacks
try:
    from .summary_views import _pick_fk_field, _pick_numeric_field  # type: ignore
except Exception:

    def _pick_fk_field(model, preferred_names):
        # Exact name match first
        for f in model._meta.get_fields():
            if getattr(f, "is_relation", False) and not getattr(f, "many_to_many", False):
                if f.name in preferred_names:
                    return f.name
        # Then partial match
        for f in model._meta.get_fields():
            if getattr(f, "is_relation", False) and not getattr(f, "many_to_many", False):
                for p in preferred_names:
                    if p in f.name:
                        return f.name
        return None

    def _pick_numeric_field(model, preferred_names):
        numeric_types = {
            "IntegerField",
            "SmallIntegerField",
            "PositiveIntegerField",
            "PositiveSmallIntegerField",
            "BigIntegerField",
            "FloatField",
            "DecimalField",
        }
        # Exact name match first
        for f in model._meta.get_fields():
            if hasattr(f, "get_internal_type") and f.get_internal_type() in numeric_types:
                if f.name in preferred_names:
                    return f.name
        # Then partial match
        for f in model._meta.get_fields():
            if hasattr(f, "get_internal_type") and f.get_internal_type() in numeric_types:
                for p in preferred_names:
                    if p in f.name:
                        return f.name
        return None


def _get_model(app_label: str, model_name: str):
    try:
        return apps.get_model(app_label, model_name)
    except Exception:
        return None


def _coerce_bool(value, default=False):
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "y", "on"}
    return bool(value)


def _coerce_float(value):
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _normalize_prompts(raw_prompts):
    if not raw_prompts:
        return []
    if isinstance(raw_prompts, str):
        raw_prompts = [raw_prompts]
    prompts = []
    for prompt in raw_prompts:
        if isinstance(prompt, str):
            trimmed = prompt.strip()
            if trimmed:
                prompts.append(trimmed)
    return prompts


class EvaluationCreateV2View(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        Evaluation = _get_model("evaluations", "Evaluation")  # type: ignore
        Criterion = _get_model("evaluations", "Criterion") or _get_model(
            "evaluations", "EvaluationCriterion"
        )  # type: ignore
        ClarificationThread = _get_model("evaluations", "ClarificationThread")
        ClarificationMessage = _get_model("evaluations", "ClarificationMessage")
        if Evaluation is None or Criterion is None:
            return Response({"detail": "Evaluation models not available"}, status=500)

        # subject_id must be in query params
        try:
            subject_id = int(request.query_params.get("subject_id", ""))
        except Exception:
            return Response({"detail": "subject_id query param is required"}, status=400)

        # required in body
        criterion_id = request.data.get("criterion_id")
        score_val = request.data.get("score")
        familiarity_val = request.data.get("familiarity")  # optional
        comment_val = request.data.get("comment", "")
        comment_anonymous_val = request.data.get("comment_is_anonymous")
        self_awareness_val = request.data.get("self_awareness_flag")
        expected_peer_val = request.data.get("expected_peer_score")
        divergence_comment_val = request.data.get("divergence_comment", "")
        clarification_prompts = _normalize_prompts(request.data.get("clarification_prompts"))
        if not criterion_id or score_val is None:
            return Response({"detail": "criterion_id and score are required"}, status=400)

        # Dynamically resolve field names on Evaluation
        subject_field = _pick_fk_field(Evaluation, ["subject", "target", "rated_user", "profile", "user"])
        rater_field = _pick_fk_field(Evaluation, ["rater", "evaluator", "author", "user"])
        criterion_field = _pick_fk_field(Evaluation, ["criterion", "criteria"])
        score_field = _pick_numeric_field(Evaluation, ["score", "rating", "value", "val", "points"])
        familiarity_field = _pick_numeric_field(Evaluation, ["familiarity", "weight", "confidence"])  # optional

        if not (subject_field and rater_field and criterion_field and score_field):
            return Response({"detail": "Evaluation model fields could not be inferred."}, status=500)

        # Validate criterion exists
        try:
            Criterion.objects.get(pk=criterion_id)
        except Criterion.DoesNotExist:
            return Response({"detail": "criterion_id not found"}, status=404)

        # Create evaluation
        payload = {
            f"{subject_field}_id": subject_id,
            f"{rater_field}_id": request.user.id,
            f"{criterion_field}_id": criterion_id,
            score_field: score_val,
        }
        if familiarity_field and familiarity_val is not None:
            payload[familiarity_field] = familiarity_val
        if hasattr(Evaluation, "comment") and comment_val:
            payload["comment"] = comment_val
        if hasattr(Evaluation, "comment_is_anonymous"):
            payload["comment_is_anonymous"] = _coerce_bool(comment_anonymous_val, default=True)
        if hasattr(Evaluation, "self_awareness_flag"):
            payload["self_awareness_flag"] = _coerce_bool(self_awareness_val, default=False)
        if hasattr(Evaluation, "expected_peer_score"):
            expected_peer = _coerce_float(expected_peer_val)
            if expected_peer is not None:
                payload["expected_peer_score"] = expected_peer
        if hasattr(Evaluation, "divergence_comment") and divergence_comment_val:
            payload["divergence_comment"] = divergence_comment_val

        ev = Evaluation.objects.create(**payload)

        # Participation gating for SUBJECT (rated user): count their outbound ratings
        outbound_count = Evaluation.objects.filter(**{f"{rater_field}_id": subject_id}).count()

        min_outbound = int(getattr(settings, "EVALUATIONS_MIN_OUTBOUND", 10))

        status_value = EvaluationMeta.STATUS_ACTIVE if outbound_count >= min_outbound else EvaluationMeta.STATUS_PENDING
        EvaluationMeta.objects.create(evaluation=ev, status=status_value)

        if clarification_prompts and ClarificationThread and ClarificationMessage:
            thread, created_thread = ClarificationThread.objects.get_or_create(
                evaluation=ev,
                defaults={
                    "subject_id": getattr(ev, f"{subject_field}_id"),
                    "evaluator_id": getattr(ev, f"{rater_field}_id"),
                    "pending_response": False,
                },
            )
            if not created_thread:
                thread.subject_id = getattr(ev, f"{subject_field}_id")
                thread.evaluator_id = getattr(ev, f"{rater_field}_id")
                thread.is_closed = False
                thread.save()
            ClarificationMessage.objects.bulk_create(
                [
                    ClarificationMessage(
                        thread=thread,
                        sender_role=getattr(ClarificationMessage, "ROLE_SYSTEM", "system"),
                        body=prompt,
                        is_anonymous=True,
                    )
                    for prompt in clarification_prompts
                ]
            )
            thread.updated_at = timezone.now()
            thread.save(update_fields=["updated_at"])

        return Response({"id": ev.pk, "status": status_value}, status=201)
