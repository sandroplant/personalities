from django.urls import path
from .views import CriterionListCreateView, EvaluationListCreateView, EvaluationTasksView

urlpatterns = [
    path('criteria/', CriterionListCreateView.as_view(), name='criteria-list-create'),
    path('evaluations/', EvaluationListCreateView.as_view(), name='evaluation-list-create'),
    path('summary/', EvaluationSummaryView.as_view(), name='evaluation-summary'),
    path('tasks/', EvaluationTasksView.as_view(), name='evaluation-tasks'),
]
