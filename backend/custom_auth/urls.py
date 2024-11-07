from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('create_post/', views.create_post, name='create_post'),
    # Add other URLs as needed
]
