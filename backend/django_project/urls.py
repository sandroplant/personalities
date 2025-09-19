from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from userprofiles.views import upload_profile_picture

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from evaluations.views import EvaluationCreateView, EvaluationTasksView

urlpatterns = [
    path("admin/", admin.site.urls),
    # Main application and other app routes
    path("", include("core.urls")),
    path("ai/", include("ai.urls")),
    path("messaging/", include("messaging.urls")),
    path("userprofiles/", include("userprofiles.urls")),
    path("spotify/", include("spotify_auth.urls")),
    path("uploads/", include("uploads.urls")),
    path("questions/", include("questions.urls")),
    # Evaluations app (includes tasks/create endpoints)
    path("evaluations/", include("evaluations.urls")),
    path("auth/", include("custom_auth.urls")),
    path("posts/", include("posts.urls")),
    # API routes (if core also exposes API)
    path("api/", include("core.urls")),
    path("api/profile/picture/", upload_profile_picture, name="upload_profile_picture"),
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
    path("evaluations/tasks/", EvaluationTasksView.as_view(), name="evaluation-tasks"),
    path(
        "evaluations/create/", EvaluationCreateView.as_view(), name="evaluation-create"
    ),
]

# Optional: privacy sub-routes if present
try:
    urlpatterns += [path("userprofiles/privacy/", include("userprofiles.privacy_urls"))]
except Exception:
    pass

# Optional: CSRF endpoint for SPA clients (import only if available)
try:
    from core.csrf_views import csrf as csrf_view  # type: ignore

    try:
        urlpatterns.insert(0, path("auth/csrf/", csrf_view, name="csrf"))
    except Exception:
        urlpatterns += [path("auth/csrf/", csrf_view, name="csrf")]
except Exception:
    pass

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(
        getattr(settings, "MEDIA_URL", "/media/"),
        document_root=getattr(settings, "MEDIA_ROOT", None),
    )
