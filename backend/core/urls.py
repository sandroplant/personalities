from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views
from .views import GetUserProfileApi, UpdateUserProfileApi

# Initialize the router and register viewsets
router = DefaultRouter()
router.register(r"users", views.UserViewSet)
router.register(r"profiles", views.ProfileViewSet)
router.register(r"posts", views.PostViewSet)
router.register(r"messages", views.MessageViewSet)

urlpatterns = [
    # Include the router URLs for the ViewSets
    path("", include(router.urls)),
    # Authentication Routes
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
    # User Profile API Routes (tests expect *_api names)
    path("profile/", GetUserProfileApi.as_view(), name="get_user_profile_api"),
    path(
        "profile/update/",
        UpdateUserProfileApi.as_view(),
        name="update_user_profile_api",
    ),
    # Backward-compat short names (optional; keep if used elsewhere)
    path("profile/", GetUserProfileApi.as_view(), name="get_user_profile"),
    path("profile/update/", UpdateUserProfileApi.as_view(), name="update_user_profile"),
    # JWT Authentication Endpoints
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Health & metrics
    path("health/", views.health_check, name="health_check"),
    path("metrics", views.metrics, name="metrics"),
]

# Custom error handlers
handler500 = "core.views.handler500"
