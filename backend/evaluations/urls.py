from django.urls import path

from .create_views import EvaluationCreateV2View
from .summary_views import EvaluationSummaryV2View

# Optional legacy views (kept for backward compatibility if present)
try:
    from .views import (  # type: ignore
        EvaluationSummaryView,
        EvaluationTasksView,
        EvaluationCreateView,
    )
except Exception:
    EvaluationSummaryView = None  # type: ignore
    EvaluationTasksView = None  # type: ignore
    EvaluationCreateView = None  # type: ignore

urlpatterns = []

# Legacy summary (if available)
if EvaluationSummaryView is not None:
    urlpatterns.append(
        path("summary/", EvaluationSummaryView.as_view(), name="evaluation-summary")
    )

# Legacy tasks/create (if available)
if EvaluationTasksView is not None:
    urlpatterns.append(
        path("tasks/", EvaluationTasksView.as_view(), name="evaluation-tasks")
    )
if EvaluationCreateView is not None:
    urlpatterns.append(
        path("create/", EvaluationCreateView.as_view(), name="evaluation-create")
    )

# V2 endpoints (always present in this file)
urlpatterns += [
    path("summary-v2/", EvaluationSummaryV2View.as_view(), name="evaluation-summary-v2"),
    path("create-v2/", EvaluationCreateV2View.as_view(), name="evaluation-create-v2"),
]
