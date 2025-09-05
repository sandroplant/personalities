from django.urls import path
<<<<<<< HEAD
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
]
=======
import importlib

# Import views module safely and resolve view classes if they exist.
_views = importlib.import_module('.views', __package__)
EvaluationCriteriaListView = getattr(_views, 'EvaluationCriteriaListView', None)
EvaluationCreateView = getattr(_views, 'EvaluationCreateView', None)
EvaluationTasksView = getattr(_views, 'EvaluationTasksView', None)
EvaluationSummaryView = getattr(_views, 'EvaluationSummaryView', None)

from .summary_views import EvaluationSummaryV2View
from .create_views import EvaluationCreateV2View

urlpatterns = []

if EvaluationCriteriaListView is not None:
    urlpatterns.append(path("criteria/", EvaluationCriteriaListView.as_view(), name="evaluation-criteria-list"))
if EvaluationCreateView is not None:
    urlpatterns.append(path("create/", EvaluationCreateView.as_view(), name="evaluation-create"))
if EvaluationTasksView is not None:
    urlpatterns.append(path("tasks/", EvaluationTasksView.as_view(), name="evaluation-tasks"))
if EvaluationSummaryView is not None:
    urlpatterns.append(path("summary/", EvaluationSummaryView.as_view(), name="evaluation-summary"))

urlpatterns += [
    path("summary-v2/", EvaluationSummaryV2View.as_view(), name="evaluation-summary-v2"),
    path("create-v2/", EvaluationCreateV2View.as_view(), name="evaluation-create-v2"),
]

# If the legacy create view is missing, map the legacy path to v2 to keep
# the existing frontend working without changes.
if EvaluationCreateView is None:
    urlpatterns.append(path("create/", EvaluationCreateV2View.as_view(), name="evaluation-create"))
>>>>>>> fddbe62 (Privacy + profile requests backend scaffolding; viewer-aware privacy; CI; frontend stubs)
