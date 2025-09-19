from __future__ import annotations

from django.db.models import Q

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models_privacy import Friendship, ProfileRequest
from .serializers_privacy import FriendshipSerializer, ProfileRequestSerializer


class IsAuthenticated(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class FriendshipViewSet(viewsets.ModelViewSet):
    queryset = Friendship.objects.all()
    serializer_class = FriendshipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Return friendships involving the current user only
        return Friendship.objects.filter(Q(user_a=user) | Q(user_b=user))

    def perform_create(self, serializer):
        # Allow creating accepted friendship directly for now
        instance = serializer.save()
        return instance


class ProfileRequestViewSet(viewsets.ModelViewSet):
    queryset = ProfileRequest.objects.all()
    serializer_class = ProfileRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        owner = self.request.query_params.get("owner")
        requester = self.request.query_params.get("requester")
        qs = ProfileRequest.objects.filter(Q(owner=user) | Q(requester=user))
        if owner:
            qs = qs.filter(owner_id=owner)
        if requester:
            qs = qs.filter(requester_id=requester)
        return qs.order_by("-created_at")

    def perform_create(self, serializer):
        # Enforce simple reciprocity: allow at least one pending; block duplicates by UniqueConstraint  # noqa: E501
        instance = serializer.save()
        return instance

    def _get_object_owned_by_self(self, pk):
        obj = self.get_object()
        if obj.owner_id != self.request.user.id:
            self.permission_denied(self.request, message="Only the owner can change this request")
        return obj

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        obj = self._get_object_owned_by_self(pk)
        if obj.status != ProfileRequest.STATUS_PENDING:
            return Response({"detail": "Request is not pending"}, status=status.HTTP_400_BAD_REQUEST)
        obj.status = ProfileRequest.STATUS_APPROVED
        obj.save(update_fields=["status", "updated_at"])
        return Response({"status": obj.status})

    @action(detail=True, methods=["post"], url_path="deny")
    def deny(self, request, pk=None):
        obj = self._get_object_owned_by_self(pk)
        if obj.status != ProfileRequest.STATUS_PENDING:
            return Response({"detail": "Request is not pending"}, status=status.HTTP_400_BAD_REQUEST)
        obj.status = ProfileRequest.STATUS_DENIED
        obj.save(update_fields=["status", "updated_at"])
        return Response({"status": obj.status})

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        obj = self.get_object()
        if obj.requester_id != request.user.id:
            self.permission_denied(request, message="Only the requester can cancel")
        if obj.status != ProfileRequest.STATUS_PENDING:
            return Response({"detail": "Request is not pending"}, status=status.HTTP_400_BAD_REQUEST)
        obj.status = ProfileRequest.STATUS_CANCELLED
        obj.save(update_fields=["status", "updated_at"])
        return Response({"status": obj.status})
