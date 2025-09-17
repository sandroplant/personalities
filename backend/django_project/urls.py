<<<<<<< Updated upstream
from django.urls import path, include
=======
from core.views import GetUserProfileApi, UpdateUserProfileApi
>>>>>>> Stashed changes
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
<<<<<<< Updated upstream
=======

# Aliases for eval endpoints so reverse('evaluation-*') works at project level
from evaluations.views import EvaluationCreateView, EvaluationTasksView  # NEW
>>>>>>> Stashed changes

urlpatterns = [
    # Main application and other app routes
    path("", include("core.urls")),
    path("ai/", include("ai.urls")),
    path("messaging/", include("messaging.urls")),
    path("userprofiles/", include("userprofiles.urls")),
    path("spotify/", include("spotify_auth.urls")),
    path("uploads/", include("uploads.urls")),
    # Added questions route
    path("questions/", include("questions.urls")),
<<<<<<< Updated upstream
    path("evaluations/", include("evaluations.urls")),
=======
    path("evaluations/", include("evaluations.urls")),  # app include (kept)
>>>>>>> Stashed changes
    path("auth/", include("custom_auth.urls")),
    path("posts/", include("posts.urls")),
    # API routes
    path("api/", include("core.urls")),
    path("accounts/", include("allauth.urls")),  # Allauth routes
    # Schema and Documentation URLs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/schema/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
<<<<<<< Updated upstream
=======
]

# Explicit profile API routes used by tests (ensure they resolve to session-aware views)
urlpatterns += [
    path(
        "api/profile/get/",
        GetUserProfileApi.as_view(),
        name="get_user_profile_api",
    ),
    path(
        "api/profile/update/",
        UpdateUserProfileApi.as_view(),
        name="update_user_profile_api",
    ),
]

# Project-level **aliases** for evaluation routes to guarantee reverse('evaluation-*')
urlpatterns += [
    path("evaluations/tasks/", EvaluationTasksView.as_view(), name="evaluation-tasks"),
    path(
        "evaluations/create/", EvaluationCreateView.as_view(), name="evaluation-create"
    ),
>>>>>>> Stashed changes
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
