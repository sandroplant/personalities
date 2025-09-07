from rest_framework import generics, permissions, status
from rest_framework.authentication import TokenAuthentication
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Avg

from .models import Criterion, Evaluation
from .serializers import CriterionSerializer, EvaluationSerializer


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
        # Exclude current user from subjects
        subjects = User.objects.exclude(id=user.id)
        criteria = Criterion.objects.all()
        tasks = []
        for subject in subjects:
            for criterion in criteria:
                # Check if the user has previously rated this subject on
                # this criterion
                exists = Evaluation.objects.filter(
                    evaluator=user, subject=subject, criterion=criterion
                ).exists()
                tasks.append(
                    {
                        "subjectId": subject.id,
                        "subjectName": getattr(
                            subject, "username", str(subject)
                        ),
                        "criterionId": criterion.id,
                        "criterionName": criterion.name,
                        "firstTime": not exists,
                    }
                )
        import random

        random.shuffle(tasks)
        return Response(tasks)


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
