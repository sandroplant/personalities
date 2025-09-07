from django.urls import path
from .views import (
    EvaluationCriteriaListView,
    EvaluationCreateView,
    EvaluationTasksView,
    EvaluationSummaryView,
)

urlpatterns = [
    path(
        "criteria/",
        EvaluationCriteriaListView.as_view(),
        name="evaluation-criteria-list",
    ),
    path("create/", EvaluationCreateView.as_view(), name="evaluation-create"),
    path("tasks/", EvaluationTasksView.as_view(), name="evaluation-tasks"),
    path(
        "summary/", EvaluationSummaryView.as_view(), name="evaluation-summary"
    ),
]
