from django.urls import path

from .create_views import EvaluationCreateV2View
from .summary_views import EvaluationSummaryV2View

# Optional legacy alias (kept for backward-compat if present)
try:
    from .views import EvaluationSummaryView  # type: ignore
except Exception:
    EvaluationSummaryView = None

urlpatterns = []

if EvaluationSummaryView is not None:
    urlpatterns.append(
        path("summary/", EvaluationSummaryView.as_view(), name="evaluation-summary")
    )

urlpatterns += [
    path(
        "summary-v2/", EvaluationSummaryV2View.as_view(), name="evaluation-summary-v2"
    ),
    path("create-v2/", EvaluationCreateV2View.as_view(), name="evaluation-create-v2"),
]
