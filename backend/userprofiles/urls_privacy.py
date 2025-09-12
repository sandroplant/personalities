from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views_privacy import FriendshipViewSet, ProfileRequestViewSet

router = DefaultRouter()
router.register(r"friendships", FriendshipViewSet, basename="friendship")
router.register(r"profile-requests", ProfileRequestViewSet, basename="profile-request")

urlpatterns = [
    path("", include(router.urls)),
]
