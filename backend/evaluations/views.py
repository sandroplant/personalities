from rest_framework import generics, permissions, status
from rest_framework.authentication import TokenAuthentication
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Avg, StdDev
from rest_framework.exceptions import ValidationError

from .models import Criterion, Evaluation
from userprofiles.models import Friendship
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from .signals import evaluation_submitted
from .serializers import CriterionSerializer, EvaluationSerializer


REPEAT_DAYS = 30


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
        evaluator = self.request.user
        first_rating = not Evaluation.objects.filter(
            evaluator=evaluator, subject_id=subject_id
        ).exists()
        if first_rating and serializer.validated_data.get("familiarity") is None:
            raise ValidationError({"familiarity": "This field is required."})
        evaluation = serializer.save(evaluator=evaluator, subject_id=subject_id)

        stats = Evaluation.objects.filter(evaluator=evaluator).aggregate(
            mean=Avg("score"), stddev=StdDev("score")
        )
        mean = stats["mean"] or 0
        stddev = stats["stddev"] or 0
        normalized = (evaluation.score - mean) / stddev if stddev else 0
        Evaluation.objects.filter(pk=evaluation.pk).update(
            rater_mean=mean,
            rater_stddev=stddev,
            normalized_score=normalized,
        )
        evaluation.refresh_from_db()
        evaluation_submitted.send(sender=Evaluation, evaluation=evaluation)


class EvaluationTasksView(APIView):
    """
    Returns a shuffled list of evaluation tasks for the current user.
    Each task contains a subject (friend) and a criterion to rate.
    The `firstTime` flag indicates whether the user has rated that
    friend on that criterion before.
    """

    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        User = get_user_model()

        limit = int(request.query_params.get("limit", 20))
        offset = int(request.query_params.get("offset", 0))

        friendships = Friendship.objects.filter(
            Q(from_user=user, is_confirmed=True) | Q(to_user=user, is_confirmed=True)
        )
        friend_ids = [
            f.to_user_id if f.from_user_id == user.id else f.from_user_id for f in friendships
        ]
        subjects = User.objects.filter(id__in=friend_ids)
        criteria = Criterion.objects.all()

        tasks = []
        count = 0
        repeat_threshold = timezone.now() - timedelta(days=REPEAT_DAYS)

        for subject in subjects.iterator():
            for criterion in criteria.iterator():
                latest = (
                    Evaluation.objects.filter(
                        evaluator=user, subject=subject, criterion=criterion
                    )
                    .order_by("-created_at")
                    .first()
                )
                if latest and latest.created_at >= repeat_threshold:
                    continue

                first_time = latest is None

                if count >= offset:
                    tasks.append(
                        {
                            "subjectId": subject.id,
                            "subjectName": getattr(subject, "username", str(subject)),
                            "criterionId": criterion.id,
                            "criterionName": criterion.name,
                            "firstTime": first_time,
                        }
                    )
                    if len(tasks) >= limit:
                        return Response({"tasks": tasks, "next_offset": offset + len(tasks)})
                count += 1

        return Response({"tasks": tasks, "next_offset": None})


class EvaluationSummaryView(APIView):
    """
    Returns aggregated evaluation results for a subject.

    The endpoint expects a ``subject_id`` query parameter. It returns, for each
    criterion, the criterion's ID, name and the average score across all
    evaluations of the specified subject. An empty list is returned if the user
    has no evaluations yet.
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

        # Aggregate average score per criterion
        summary = (
            evaluations.values("criterion__id", "criterion__name")
            .annotate(avg_score=Avg("score"))
            .order_by("criterion__name")
        )

        results = [
            {
                "criterion_id": item["criterion__id"],
                "criterion_name": item["criterion__name"],
                "average_score": item["avg_score"],
            }
            for item in summary
        ]
        return Response(results)
