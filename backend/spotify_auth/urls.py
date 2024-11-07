# spotify_auth/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login, name='spotify_login'),
    path('callback/', views.callback, name='spotify_callback'),
]
