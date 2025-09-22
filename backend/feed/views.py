"""API views for the feed service."""

from __future__ import annotations

from rest_framework import generics, permissions
from rest_framework.authentication import SessionAuthentication, TokenAuthentication

from .serializers import FeedEventSerializer
from .services import FeedService


class PersonalizedFeedView(generics.ListAPIView):
    """Return ranked feed events for the authenticated user."""

    serializer_class = FeedEventSerializer
    authentication_classes = [SessionAuthentication, TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        service = FeedService(self.request.user)
        ranked = service.get_ranked_events()
        for item in ranked:
            item.event.score = item.score
        return [item.event for item in ranked]
