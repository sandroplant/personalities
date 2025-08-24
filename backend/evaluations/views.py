from rest_framework import generics, permissions
from rest_framework.authentication import TokenAuthentication

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
        serializer.save(evaluator=self.request.user)
