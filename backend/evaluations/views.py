from __future__ import annotations

import math
import os as _os
import random
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Max, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import generics, permissions, status
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from rest_framework.views import APIView

from userprofiles.models import Friendship

from .meta_models import EvaluationMeta
from .models import ClarificationMessage, ClarificationThread, Criterion, Evaluation
from .rater_models import RaterStats
from .serializers import (
    ClarificationThreadSerializer,
    CriterionSerializer,
    EvaluationSerializer,
)
from .signals import evaluation_submitted

# Backwards-compat constant for tests
try:  # noqa: SIM105
    REPEAT_DAYS  # type: ignore[name-defined]
except NameError:
    REPEAT_DAYS = int(_os.getenv("EVALUATIONS_REPEAT_DAYS", "7"))


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


class CriterionListCreateView(generics.ListCreateAPIView):
    queryset = Criterion.objects.all()
    serializer_class = CriterionSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]


class EvaluationListCreateView(generics.ListCreateAPIView):
    serializer_class = EvaluationSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Evaluation.objects.all()
        subject_id = self.request.query_params.get("subject_id")
        if subject_id:
            queryset = queryset.filter(subject__id=subject_id)
        return queryset

    def perform_create(self, serializer):
        subject_id = self.request.query_params.get("subject_id")
        serializer.save(evaluator=self.request.user, subject_id=subject_id)


class EvaluationTasksView(APIView):
    """
    Return a shuffled list of evaluation tasks for the current user.
    Only confirmed friends are considered.
    A task is included if the last evaluation on (subject, criterion)
    is older than REPEAT_DAYS (or never rated).
    """

    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def _confirmed_friend_ids(self, user_id: int) -> set[int]:
        sent = Friendship.objects.filter(from_user_id=user_id, is_confirmed=True).values_list("to_user_id", flat=True)
        received = Friendship.objects.filter(to_user_id=user_id, is_confirmed=True).values_list(
            "from_user_id", flat=True
        )
        return set(sent).union(set(received))

    def get(self, request):
        user = request.user
        User = get_user_model()

        # Only confirmed friends
        friend_ids = self._confirmed_friend_ids(user.id)
        subjects = User.objects.filter(id__in=friend_ids)

        criteria = list(Criterion.objects.all())
        if not criteria or not subjects.exists():
            return Response({"tasks": []})

        # Cooldown cutoff
        cutoff = timezone.now() - timedelta(days=REPEAT_DAYS)

        # For each (subject, criterion), include if last eval is <= cutoff or never rated
        tasks = []
        for subject in subjects:
            for criterion in criteria:
                qs = Evaluation.objects.filter(evaluator=user, subject=subject, criterion=criterion)
                last_ts = qs.aggregate(last=Max("created_at"))["last"]
                include = last_ts is None or last_ts <= cutoff
                if include:
                    first_time = not qs.exists()
                    tasks.append(
                        {
                            "subjectId": subject.id,
                            "subjectName": getattr(subject, "username", str(subject)),
                            "criterionId": criterion.id,
                            "criterionName": criterion.name,
                            "firstTime": first_time,
                        }
                    )

        random.shuffle(tasks)
        return Response({"tasks": tasks})


class EvaluationCreateView(APIView):
    """
    Create an evaluation for the current user, enforcing a cooldown
    of REPEAT_DAYS for the same (subject, criterion) pair.
    """

    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        subject_id = request.query_params.get("subject_id") or request.data.get("subject_id")
        criterion_id = request.data.get("criterion_id")
        score = request.data.get("score")
        familiarity = request.data.get("familiarity")
        comment = request.data.get("comment", "")
        comment_is_anonymous = _coerce_bool(request.data.get("comment_is_anonymous"), default=True)
        self_awareness_flag = _coerce_bool(request.data.get("self_awareness_flag"), default=False)
        expected_peer_score = _coerce_float(request.data.get("expected_peer_score"))
        divergence_comment = request.data.get("divergence_comment", "")
        clarification_prompts = request.data.get("clarification_prompts") or []

        if subject_id is None or criterion_id is None or score is None:
            return Response(
                {
                    "detail": "subject_id, criterion_id, and score are required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Enforce cooldown
        cutoff = timezone.now() - timedelta(days=REPEAT_DAYS)
        exists_recent = Evaluation.objects.filter(
            evaluator=user,
            subject_id=subject_id,
            criterion_id=criterion_id,
            created_at__gte=cutoff,
        ).exists()
        if exists_recent:
            return Response(
                {"detail": "Evaluation cooldown active."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        create_kwargs = {
            "evaluator": user,
            "subject_id": subject_id,
            "criterion_id": criterion_id,
            "score": score,
        }
        if familiarity is not None:
            create_kwargs["familiarity"] = familiarity
        if comment:
            create_kwargs["comment"] = comment
        create_kwargs["comment_is_anonymous"] = comment_is_anonymous
        create_kwargs["self_awareness_flag"] = self_awareness_flag
        if expected_peer_score is not None:
            create_kwargs["expected_peer_score"] = expected_peer_score
        if divergence_comment:
            create_kwargs["divergence_comment"] = divergence_comment

        evaluation = Evaluation.objects.create(**create_kwargs)

        if isinstance(clarification_prompts, str):
            clarification_prompts = [clarification_prompts]
        clarification_prompts = [p.strip() for p in clarification_prompts if isinstance(p, str) and p.strip()]
        if clarification_prompts:
            thread, created_thread = ClarificationThread.objects.get_or_create(
                evaluation=evaluation,
                defaults={
                    "subject": evaluation.subject,
                    "evaluator": evaluation.evaluator,
                    "pending_response": False,
                },
            )
            if not created_thread:
                # Ensure linkage is correct even if thread pre-existed
                thread.subject = evaluation.subject
                thread.evaluator = evaluation.evaluator
                thread.is_closed = False
                if thread.pending_response is None:
                    thread.pending_response = False
                thread.save()
            ClarificationMessage.objects.bulk_create(
                [
                    ClarificationMessage(
                        thread=thread,
                        sender_role=ClarificationMessage.ROLE_SYSTEM,
                        body=prompt,
                        is_anonymous=True,
                    )
                    for prompt in clarification_prompts
                ]
            )

        # Notify downstream listeners so reliability/objectivity are recalculated.
        evaluation_submitted.send(sender=Evaluation, evaluation=evaluation)

        # Recompute normalization statistics for this evaluator.
        rater_evaluations = list(Evaluation.objects.filter(evaluator=user))
        scores = [float(ev.score) for ev in rater_evaluations]
        count = len(scores)

        if count:
            mean_score = sum(scores) / count
            if count > 1:
                variance = sum((s - mean_score) ** 2 for s in scores) / count
                std_score = math.sqrt(variance)
            else:
                std_score = 0.0
        else:  # pragma: no cover - defensive guard
            mean_score = 0.0
            std_score = 0.0

        normalized_denominator = std_score if std_score > 0 else None
        for ev in rater_evaluations:
            ev.rater_mean = mean_score
            ev.rater_stddev = std_score
            if normalized_denominator:
                ev.normalized_score = (float(ev.score) - mean_score) / normalized_denominator
            else:
                ev.normalized_score = 0.0

        if rater_evaluations:
            Evaluation.objects.bulk_update(
                rater_evaluations,
                ["rater_mean", "rater_stddev", "normalized_score"],
            )

        # Persist/update rater statistics.
        if rater_evaluations:
            stats, _ = RaterStats.objects.get_or_create(user=user)
            extreme_count = sum(1 for s in scores if s <= 1.0 or s >= 5.0)
            stats.ratings_count = count
            stats.mean_score = mean_score
            stats.std_score = std_score
            stats.extreme_rate = (extreme_count / count) if count else 0.0

            reliability_agg = (
                Evaluation.objects.filter(evaluator=user)
                .exclude(reliability_weight__isnull=True)
                .aggregate(avg_rel=Avg("reliability_weight"))
            )
            avg_rel = reliability_agg.get("avg_rel")
            if avg_rel is not None:
                stats.reliability = float(avg_rel)
            stats.save()

        # Evaluate outbound gating for the subject being rated.
        min_outbound = int(getattr(settings, "EVALUATIONS_MIN_OUTBOUND", 10))
        outbound_count = Evaluation.objects.filter(evaluator_id=subject_id).count()
        status_value = EvaluationMeta.STATUS_ACTIVE if outbound_count >= min_outbound else EvaluationMeta.STATUS_PENDING

        meta, created = EvaluationMeta.objects.get_or_create(
            evaluation=evaluation,
            defaults={"status": status_value},
        )
        if not created and meta.status != status_value:
            meta.status = status_value
            meta.save(update_fields=["status"])

        if status_value == EvaluationMeta.STATUS_ACTIVE:
            EvaluationMeta.objects.filter(
                evaluation__subject_id=subject_id,
                status=EvaluationMeta.STATUS_PENDING,
            ).update(status=EvaluationMeta.STATUS_ACTIVE)

        return Response({"id": evaluation.id}, status=status.HTTP_201_CREATED)


class EvaluationSummaryView(APIView):
    """
    Returns aggregated evaluation results for a subject.

    Expects: ?subject_id=<int>
    Response: list of {criterion_id, criterion_name, average_score}
    """

    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        subject_id = request.query_params.get("subject_id")
        if not subject_id:
            return Response(
                {"detail": "subject_id query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        evaluations = Evaluation.objects.filter(subject_id=subject_id)
        if not evaluations.exists():
            return Response([])

        summary = (
            evaluations.values("criterion__id", "criterion__name")
            .annotate(avg_score=Avg("score"))
            .order_by("criterion__name")
        )

        public_comment_counts = (
            evaluations.filter(comment__gt="", comment_is_anonymous=False)
            .values("criterion__id")
            .annotate(public_comment_count=Count("id"))
        )
        public_comment_map = {
            row["criterion__id"]: row["public_comment_count"] for row in public_comment_counts
        }

        results = [
            {
                "criterion_id": row["criterion__id"],
                "criterion_name": row["criterion__name"],
                "average_score": row["avg_score"],
                "public_comment_count": public_comment_map.get(row["criterion__id"], 0),
            }
            for row in summary
        ]
        return Response(results)


class ClarificationInboxView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        threads = ClarificationThread.objects.filter(
            Q(subject=request.user) | Q(evaluator=request.user)
        ).select_related("evaluation")

        payload = []
        for thread in threads:
            latest = thread.messages.order_by("-created_at").first()
            latest_payload = None
            if latest:
                latest_payload = {
                    "sender_role": latest.sender_role,
                    "is_anonymous": latest.is_anonymous,
                    "created_at": latest.created_at.isoformat(),
                }
            awaiting_my_response = False
            if request.user == thread.evaluator:
                awaiting_my_response = thread.pending_response and not thread.is_closed
            elif latest and latest.sender_role == ClarificationMessage.ROLE_EVALUATOR:
                awaiting_my_response = not thread.pending_response and not thread.is_closed

            payload.append(
                {
                    "thread_id": thread.id,
                    "evaluation_id": thread.evaluation_id,
                    "pending_response": thread.pending_response,
                    "awaiting_my_response": awaiting_my_response,
                    "is_closed": thread.is_closed,
                    "latest_message": latest_payload,
                }
            )

        return Response(payload)


class ClarificationRequestView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        question = (request.data.get("question") or "").strip()
        if not question:
            return Response({"detail": "question is required"}, status=status.HTTP_400_BAD_REQUEST)

        thread_id = request.data.get("thread_id")
        if thread_id:
            thread = get_object_or_404(ClarificationThread, pk=thread_id, subject=request.user)
        else:
            evaluation_id = request.data.get("evaluation_id")
            if not evaluation_id:
                return Response(
                    {"detail": "evaluation_id is required when thread_id is not provided."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            evaluation = get_object_or_404(Evaluation, pk=evaluation_id, subject=request.user)
            thread, _ = ClarificationThread.objects.get_or_create(
                evaluation=evaluation,
                defaults={
                    "subject": evaluation.subject,
                    "evaluator": evaluation.evaluator,
                    "pending_response": False,
                },
            )

        message = ClarificationMessage.objects.create(
            thread=thread,
            sender_role=ClarificationMessage.ROLE_SUBJECT,
            body=question,
            is_anonymous=False,
        )
        thread.pending_response = True
        thread.is_closed = False
        thread.updated_at = timezone.now()
        thread.save(update_fields=["pending_response", "is_closed", "updated_at"])

        data = {
            "thread_id": thread.id,
            "message_id": message.id,
        }
        return Response(data, status=status.HTTP_201_CREATED)


class ClarificationThreadDetailView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, thread_id):
        thread = get_object_or_404(
            ClarificationThread,
            Q(subject=request.user) | Q(evaluator=request.user),
            pk=thread_id,
        )
        serializer = ClarificationThreadSerializer(thread)
        data = serializer.data
        data["role"] = "evaluator" if request.user == thread.evaluator else "subject"
        return Response(data)


class ClarificationRespondView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, thread_id):
        thread = get_object_or_404(ClarificationThread, pk=thread_id, evaluator=request.user)
        message_text = (request.data.get("message") or "").strip()
        if not message_text:
            return Response({"detail": "message is required"}, status=status.HTTP_400_BAD_REQUEST)

        is_anonymous = _coerce_bool(request.data.get("is_anonymous"), default=True)
        close_thread = _coerce_bool(request.data.get("close_thread"), default=False)

        message = ClarificationMessage.objects.create(
            thread=thread,
            sender_role=ClarificationMessage.ROLE_EVALUATOR,
            body=message_text,
            is_anonymous=is_anonymous,
        )

        thread.pending_response = False
        if close_thread:
            thread.is_closed = True
        thread.updated_at = timezone.now()
        thread.save(update_fields=["pending_response", "is_closed", "updated_at"])

        return Response({"message_id": message.id}, status=status.HTTP_201_CREATED)
