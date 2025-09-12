from django.urls import path

from .privacy_views import (
    InfoRequestActionView,
    InfoRequestListCreateView,
    ProfileVisibilityView,
    VisibleProfileView,
)

urlpatterns = [
    path("visibility/", ProfileVisibilityView.as_view(), name="profile-visibility"),
    path(
        "info-requests/",
        InfoRequestListCreateView.as_view(),
        name="info-request-list-create",
    ),
    path(
        "info-requests/<int:pk>/<str:action>/",
        InfoRequestActionView.as_view(),
        name="info-request-action",
    ),
    path("visible-profile/", VisibleProfileView.as_view(), name="visible-profile"),
]
