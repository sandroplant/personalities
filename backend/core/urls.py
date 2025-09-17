from core import profile_session_views as session_profile_views
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views
<<<<<<< Updated upstream
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
=======
from .profile_session_views import get_user_profile_api as session_get_user_profile_api
from .profile_session_views import (
    update_user_profile_api as session_update_user_profile_api,
)
from .views import GetUserProfileApi, UpdateUserProfileApi
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
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
=======
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path("auth/logout/", views.logout_view, name="logout"),
    path("auth/ai-response/", views.ai_response_view, name="ai_response"),
    path("auth/example/", views.example_api_view, name="example_api"),
    path("auth/test-logging/", views.test_logging, name="test_logging"),
    # Spotify OAuth Routes
    path("spotify/login/", views.spotify_login, name="spotify_login"),
    path("spotify/callback/", views.spotify_callback, name="spotify_callback"),
    path("spotify/profile/", views.spotify_profile, name="spotify_profile"),
    # New, explicit API profile routes bound to session-based handlers (to satisfy tests)
    path(
        "api/profile/get/",
        session_get_user_profile_api,
        name="get_user_profile_api",
    ),
>>>>>>> Stashed changes
    path(
        "api/profile/update/",
        session_update_user_profile_api,
        name="update_user_profile_api",
    ),
<<<<<<< Updated upstream
    # Legacy profile routes pointing at the class-based views
=======
    # Legacy names used by some tests (map to the same class-based views)
>>>>>>> Stashed changes
    path("profile/", GetUserProfileApi.as_view(), name="get_user_profile"),
    path("profile/update/", UpdateUserProfileApi.as_view(), name="update_user_profile"),
    # JWT Authentication Endpoints
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
<<<<<<< Updated upstream
    path("health/", health_check, name="health_check"),
=======
    # Health & metrics
    path("health/", views.health_check, name="health_check"),
>>>>>>> Stashed changes
    path("metrics", views.metrics, name="metrics"),
]

# Custom error handlers
handler500 = "core.views.handler500"
