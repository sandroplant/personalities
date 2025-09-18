from __future__ import annotations

import os as _os
import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Avg, Max
from django.utils import timezone

from rest_framework import generics, permissions, status
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from rest_framework.views import APIView

from userprofiles.models import Friendship

from .models import Criterion, Evaluation
from .serializers import CriterionSerializer, EvaluationSerializer

# Backwards-compat constant for tests
try:  # noqa: SIM105
    REPEAT_DAYS  # type: ignore[name-defined]
except NameError:
    REPEAT_DAYS = int(_os.getenv("EVALUATIONS_REPEAT_DAYS", "7"))


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
        sent = Friendship.objects.filter(
            from_user_id=user_id, is_confirmed=True
        ).values_list("to_user_id", flat=True)
        received = Friendship.objects.filter(
            to_user_id=user_id, is_confirmed=True
        ).values_list("from_user_id", flat=True)
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
                qs = Evaluation.objects.filter(
                    evaluator=user, subject=subject, criterion=criterion
                )
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
        subject_id = request.query_params.get("subject_id") or request.data.get(
            "subject_id"
        )
        criterion_id = request.data.get("criterion_id")
        score = request.data.get("score")
        familiarity = request.data.get("familiarity")

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

        evaluation = Evaluation.objects.create(**create_kwargs)

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

        results = [
            {
                "criterion_id": row["criterion__id"],
                "criterion_name": row["criterion__name"],
                "average_score": row["avg_score"],
            }
            for row in summary
        ]
        return Response(results)
