from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Main application and other app routes
    path('', include('core.urls')),
    path('ai/', include('ai.urls')),
    path('messaging/', include('messaging.urls')),
    path('userprofiles/', include('userprofiles.urls')),
    path('spotify/', include('spotify_auth.urls')),
    path('uploads/', include('uploads.urls')),
    path('questions/', include('questions.urls')),
    path('evaluations/', include('evaluations.urls')),
    path('auth/', include('custom_auth.urls')),
    path('posts/', include('posts.urls')),

    # API routes (if core also exposes API)
    path('api/', include('core.urls')),

    # Allauth
    path('accounts/', include('allauth.urls')),

    # Schema and Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Ensure app URL includes are wired (idempotent)
try:
    # Include userprofiles (API)
    if not any(getattr(p, 'pattern', None)._route == 'userprofiles/' for p in urlpatterns):
        urlpatterns += [path('userprofiles/', include('backend.userprofiles.urls'))]
except Exception:
    try:
        urlpatterns += [path('userprofiles/', include('userprofiles.urls'))]
    except Exception:
        pass

try:
    # Include evaluations
    if not any(getattr(p, 'pattern', None)._route == 'evaluations/' for p in urlpatterns):
        urlpatterns += [path('evaluations/', include('backend.evaluations.urls'))]
except Exception:
    try:
        urlpatterns += [path('evaluations/', include('evaluations.urls'))]
    except Exception:
        pass

try:
    # Include questions
    if not any(getattr(p, 'pattern', None)._route == 'questions/' for p in urlpatterns):
        urlpatterns += [path('questions/', include('backend.questions.urls'))]
except Exception:
    try:
        urlpatterns += [path('questions/', include('questions.urls'))]
    except Exception:
        pass

try:
    # Include privacy URLs for visible-profile and info-requests
    if not any(getattr(p, 'pattern', None)._route == 'userprofiles/privacy/' for p in urlpatterns):
        urlpatterns += [path('userprofiles/privacy/', include('backend.userprofiles.privacy_urls'))]
except Exception:
    try:
        urlpatterns += [path('userprofiles/privacy/', include('userprofiles.privacy_urls'))]
    except Exception:
        pass

# CSRF endpoint for SPA clients (ensure precedence before any 'auth/' include)
try:
    from core.csrf_views import csrf as csrf_view  # import within project apps
    try:
        urlpatterns.insert(0, path('auth/csrf/', csrf_view, name='csrf'))
    except Exception:
        urlpatterns += [path('auth/csrf/', csrf_view, name='csrf')]
except Exception:
    pass

# Serve media files during development (uncomment if you have MEDIA set)
if settings.DEBUG:
    urlpatterns += static(getattr(settings, 'MEDIA_URL', '/media/'),
                          document_root=getattr(settings, 'MEDIA_ROOT', None))

# --- Privacy URLs (fixed: NO 'backend.' prefix) ---
try:
    urlpatterns += [
        path("userprofiles/", include("userprofiles.privacy_urls")),
    ]
except Exception:
    # No-op if privacy_urls isn't present
    pass
