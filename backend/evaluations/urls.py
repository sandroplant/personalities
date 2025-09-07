from django.urls import path
from .views import (
    CriterionListCreateView,
    EvaluationListCreateView,
    EvaluationTasksView,
    EvaluationSummaryView,
)

urlpatterns = [
    path("criteria/", CriterionListCreateView.as_view(), name="evaluation-criteria-list"),
    path("create/", EvaluationListCreateView.as_view(), name="evaluation-create"),
    path("tasks/", EvaluationTasksView.as_view(), name="evaluation-tasks"),
    path("summary/", EvaluationSummaryView.as_view(), name="evaluation-summary"),
]

