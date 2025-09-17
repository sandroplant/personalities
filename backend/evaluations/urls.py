from django.urls import path
<<<<<<< Updated upstream
from .views import (
    CriterionListCreateView,
    EvaluationListCreateView,
    EvaluationTasksView,
    EvaluationSummaryView,
)

urlpatterns = [
    path(
        "criteria/", CriterionListCreateView.as_view(), name="evaluation-criteria-list"
    ),
    path("create/", EvaluationListCreateView.as_view(), name="evaluation-create"),
    path("tasks/", EvaluationTasksView.as_view(), name="evaluation-tasks"),
    path("summary/", EvaluationSummaryView.as_view(), name="evaluation-summary"),
=======

from .create_views import EvaluationCreateV2View
from .summary_views import EvaluationSummaryV2View
from .views import EvaluationCreateView, EvaluationTasksView

# Optional legacy alias (kept for backward-compat if present)
try:
    from .views import EvaluationSummaryView  # type: ignore
except Exception:
    EvaluationSummaryView = None

app_name = "evaluations"

urlpatterns = []
if EvaluationSummaryView is not None:
    urlpatterns.append(
        path("summary/", EvaluationSummaryView.as_view(), name="evaluation-summary")
    )

urlpatterns += [
    path("tasks/", EvaluationTasksView.as_view(), name="evaluation-tasks"),
    path("create/", EvaluationCreateView.as_view(), name="evaluation-create"),
    path(
        "summary-v2/", EvaluationSummaryV2View.as_view(), name="evaluation-summary-v2"
    ),
    path("create-v2/", EvaluationCreateV2View.as_view(), name="evaluation-create-v2"),
>>>>>>> Stashed changes
]
