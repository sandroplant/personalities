from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [

    # Main application and other app routes
    path('', include('core.urls')),
    path('ai/', include('ai.urls')),
    path('messaging/', include('messaging.urls')),
    path('userprofiles/', include('userprofiles.urls')),
    path('spotify/', include('spotify_auth.urls')),
    path('uploads/', include('uploads.urls')),
    path('auth/', include('custom_auth.urls')),
    path('posts/', include('posts.urls')),
    path('api/', include('core.urls')),  # API routes
    path('accounts/', include('allauth.urls')),  # Allauth routes

    # Schema and Documentation URLs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
