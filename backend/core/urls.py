from core import profile_session_views as session_profile_views
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views
from .views import (
    GetUserProfileApi,
    LoginView,
    MessageViewSet,
    PostViewSet,
    ProfileViewSet,
    RegisterView,
    UpdateUserProfileApi,
    UserViewSet,
    ai_response_view,
    example_api_view,
    health_check,
    logout_view,
    spotify_callback,
    spotify_login,
    spotify_profile,
    test_logging,
)

# Initialize the router and register viewsets
router = DefaultRouter()
router.register(r"users", UserViewSet)
router.register(r"profiles", ProfileViewSet)
router.register(r"posts", PostViewSet)
router.register(r"messages", MessageViewSet)


session_get_user_profile_api = session_profile_views.get_user_profile_api
session_update_user_profile_api = session_profile_views.update_user_profile_api

urlpatterns = [
    # Admin Route
    # Include the router URLs for the ViewSets
    path("", include(router.urls)),
    # Authentication Routes
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", logout_view, name="logout"),
    path("auth/ai-response/", ai_response_view, name="ai_response"),
    path("auth/example/", example_api_view, name="example_api"),
    path("auth/test-logging/", test_logging, name="test_logging"),
    # Spotify OAuth Routes
    path("spotify/login/", spotify_login, name="spotify_login"),
    path("spotify/callback/", spotify_callback, name="spotify_callback"),
    path("spotify/profile/", spotify_profile, name="spotify_profile"),
    # Session-aware profile API routes used by tests
    path("api/profile/get/", session_get_user_profile_api, name="get_user_profile_api"),
    path(
        "api/profile/update/",
        session_update_user_profile_api,
        name="update_user_profile_api",
    ),
    # Legacy profile routes pointing at the class-based views
    path("profile/", GetUserProfileApi.as_view(), name="get_user_profile"),
    path("profile/update/", UpdateUserProfileApi.as_view(), name="update_user_profile"),
    # JWT Authentication Endpoints
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("health/", health_check, name="health_check"),
    path("metrics", views.metrics, name="metrics"),
]

# Custom error handlers
handler500 = "core.views.handler500"
