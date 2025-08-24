from rest_framework import generics, permissions
from rest_framework.authentication import TokenAuthentication
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model

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
        subject_id = self.request.query_params.get('subject_id')
        if subject_id:
            queryset = queryset.filter(subject__id=subject_id)
        return queryset

    def perform_create(self, serializer):
        subject_id = self.request.query_params.get('subject_id')
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
                # Check if the user has previously rated this subject on this criterion
                exists = Evaluation.objects.filter(
                    evaluator=user,
                    subject=subject,
                    criterion=criterion
                ).exists()
                tasks.append({
                    "subjectId": subject.id,
                    "subjectName": getattr(subject, "username", str(subject)),
                    "criterionId": criterion.id,
                    "criterionName": criterion.name,
                    "firstTime": not exists,
                })
        import random
        random.shuffle(tasks)
        return Response(tasks)
