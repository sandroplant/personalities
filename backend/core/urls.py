from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views
from .views import (
    UserViewSet,
    ProfileViewSet,
    PostViewSet,
    MessageViewSet,
    RegisterView,
    LoginView,
    logout_view,
    spotify_login,
    spotify_callback,
    spotify_profile,
    ai_response_view,
    example_api_view,
    test_logging,
    get_user_profile_api,
    update_user_profile_api,
    health_check,
)

# Initialize the router and register viewsets
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'profiles', ProfileViewSet)
router.register(r'posts', PostViewSet)
router.register(r'messages', MessageViewSet)

urlpatterns = [

    # Admin Route

    # Include the router URLs for the ViewSets
    path('', include(router.urls)),
    
    # Authentication Routes
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/ai-response/', ai_response_view, name='ai_response'),
    path('auth/example/', example_api_view, name='example_api'),
    path('auth/test-logging/', test_logging, name='test_logging'),
    
    # Spotify OAuth Routes
    path('spotify/login/', spotify_login, name='spotify_login'),
    path('spotify/callback/', spotify_callback, name='spotify_callback'),
    path('spotify/profile/', spotify_profile, name='spotify_profile'),
    
    # User Profile API Routes
    path('profile/', get_user_profile_api, name='get_user_profile'),
    path('profile/update/', update_user_profile_api, name='update_user_profile'),
    
    # JWT Authentication Endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('health/', health_check, name='health_check'),

    path('metrics', views.metrics, name='metrics'),

]

# Custom error handlers
handler500 = 'core.views.handler500'
