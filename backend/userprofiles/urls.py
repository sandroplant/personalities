# userprofiles/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # User Registration and Login
    path('register/', views.register_user, name='register_user'),
    path('login/', views.login_user, name='login_user'),
    
    # User Profile Management
    path('profile/', views.get_user_profile, name='get_user_profile'),
    path('profile/update/', views.update_user_profile, name='update_user_profile'),
    path('profile/delete/', views.delete_user_profile, name='delete_user_profile'),
    path('profile/upload-picture/', views.upload_profile_picture, name='upload_profile_picture'),
    
     # Spotify Authentication and Profile
    path('spotify/login/', views.spotify_login, name='spotify_login'),
    path('spotify/callback/', views.spotify_callback, name='spotify_callback'),
    path('spotify/profile/', views.get_user_spotify_profile, name='spotify_profile'),
    path('spotify/fetch-profile/', views.fetch_spotify_profile, name='fetch_spotify_profile'),
    
    # Additional ProfileView Endpoints (if needed)
    path('profile/view/', views.ProfileView.as_view(), name='profile_view'),
    path('profile/create/', views.ProfileView.as_view(), name='create_profile'),
]
