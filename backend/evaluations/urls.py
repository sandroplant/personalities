from django.urls import path
from .views import CriterionListCreateView, EvaluationListCreateView


urlpatterns = [
    path('criteria/', CriterionListCreateView.as_view(), name='criteria-list-create'),
    path('evaluations/', EvaluationListCreateView.as_view(), name='evaluation-list-create'),
]
