"""REST endpoints for notifications."""

from __future__ import annotations

from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.response import Response

from .models import Notification, NotificationPreference
from .serializers import NotificationPreferenceSerializer, NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    authentication_classes = [SessionAuthentication, TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationPreferenceView(generics.GenericAPIView):
    serializer_class = NotificationPreferenceSerializer
    authentication_classes = [SessionAuthentication, TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        preferences = []
        for notification_type, _ in Notification.Type.choices:
            pref, _created = NotificationPreference.objects.get_or_create(
                user=request.user,
                notification_type=notification_type,
            )
            preferences.append(pref)
        serializer = self.get_serializer(preferences, many=True)
        return Response(serializer.data)

    def patch(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, many=isinstance(request.data, list))
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if isinstance(data, list):
            updates = data
        else:
            updates = [data]
        with transaction.atomic():
            for entry in updates:
                NotificationPreference.objects.update_or_create(
                    user=request.user,
                    notification_type=entry["notification_type"],
                    defaults={"enabled": entry["enabled"]},
                )
        return Response(status=status.HTTP_204_NO_CONTENT)
