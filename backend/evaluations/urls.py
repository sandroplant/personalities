from django.urls import path

# Legacy/primary views (tests reverse these names)
from .views import EvaluationCreateView, EvaluationTasksView

# Optional v2 endpoints (import if present)
try:
    from .summary_views import EvaluationSummaryV2View  # type: ignore
except Exception:  # pragma: no cover
    EvaluationSummaryV2View = None  # type: ignore

try:
    from .create_views import EvaluationCreateV2View  # type: ignore
except Exception:  # pragma: no cover
    EvaluationCreateV2View = None  # type: ignore


# Namespacing ensures reverse("evaluations:evaluation-tasks") also works
app_name = "evaluations"

urlpatterns = [
    path("tasks/", EvaluationTasksView.as_view(), name="evaluation-tasks"),
    path("create/", EvaluationCreateView.as_view(), name="evaluation-create"),
]

# Keep v2 endpoints if modules exist
if EvaluationSummaryV2View is not None:
    urlpatterns.append(
        path(
            "summary-v2/",
            EvaluationSummaryV2View.as_view(),
            name="evaluation-summary-v2",
        )
    )
if EvaluationCreateV2View is not None:
    urlpatterns.append(
        path(
            "create-v2/", EvaluationCreateV2View.as_view(), name="evaluation-create-v2"
        )
    )
