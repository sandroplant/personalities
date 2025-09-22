"""URL configuration for feed endpoints."""

from django.urls import path

from .views import PersonalizedFeedView

urlpatterns = [
    path("personalized/", PersonalizedFeedView.as_view(), name="personalized-feed"),
]
