from datetime import datetime

from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.contrib.auth import get_user_model

from .privacy_models import ProfileVisibility, InfoRequest
from .models import Profile  # type: ignore
from .serializers import ProfileSerializer  # type: ignore
from .privacy_serializers import (
    ProfileVisibilitySerializer,
    InfoRequestCreateSerializer,
    InfoRequestSerializer,
)


def get_or_create_visibility(profile):
    obj, _ = ProfileVisibility.objects.get_or_create(profile=profile)
    return obj


class ProfileVisibilityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        profile = getattr(request.user, 'profile', None)
        if profile is None:
            return Response({"detail": "Profile not found for user"}, status=404)
        vis = get_or_create_visibility(profile)
        return Response(ProfileVisibilitySerializer(vis).data)

    def put(self, request, *args, **kwargs):
        profile = getattr(request.user, 'profile', None)
        if profile is None:
            return Response({"detail": "Profile not found for user"}, status=404)
        vis = get_or_create_visibility(profile)
        serializer = ProfileVisibilitySerializer(instance=vis, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class InfoRequestListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # List requests involving the current user
        inbox = InfoRequest.objects.filter(owner=request.user).order_by('-created_at')
        outbox = InfoRequest.objects.filter(requester=request.user).order_by('-created_at')
        return Response({
            "received": InfoRequestSerializer(inbox, many=True).data,
            "sent": InfoRequestSerializer(outbox, many=True).data,
        })

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        # Create a new request
        owner_id = request.data.get('owner_id')
        section_key = request.data.get('section_key')
        if not owner_id or not section_key:
            return Response({"detail": "owner_id and section_key are required"}, status=400)
        User = get_user_model()
        try:
            owner = User.objects.get(pk=owner_id)
        except User.DoesNotExist:
            return Response({"detail": "Owner user not found"}, status=404)
        if owner == request.user:
            return Response({"detail": "Cannot request your own profile info"}, status=400)

        # Reciprocity rule: requester cannot have more approved requests toward owner than
        # owner has approved toward requester; also only one pending at a time.
        approved_forward = InfoRequest.objects.filter(owner=owner, requester=request.user, status=InfoRequest.STATUS_APPROVED).count()
        approved_reverse = InfoRequest.objects.filter(owner=request.user, requester=owner, status=InfoRequest.STATUS_APPROVED).count()
        pending_forward = InfoRequest.objects.filter(owner=owner, requester=request.user, status=InfoRequest.STATUS_PENDING).count()
        if pending_forward > 0:
            return Response({"detail": "You already have a pending request for this user"}, status=400)
        if approved_forward > approved_reverse:
            return Response({"detail": "Reciprocity required before requesting more info from this user"}, status=403)

        req = InfoRequest.objects.create(owner=owner, requester=request.user, section_key=section_key)
        return Response(InfoRequestSerializer(req).data, status=201)


class InfoRequestActionView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk: int, action: str, *args, **kwargs):
        try:
            req = InfoRequest.objects.get(pk=pk)
        except InfoRequest.DoesNotExist:
            return Response({"detail": "Request not found"}, status=404)

        if action not in {"approve", "deny", "cancel"}:
            return Response({"detail": "Invalid action"}, status=400)

        now = timezone.now()
        if action == "approve":
            if req.owner != request.user:
                return Response({"detail": "Only the owner can approve"}, status=403)
            req.status = InfoRequest.STATUS_APPROVED
            req.resolved_at = now
            req.save(update_fields=["status", "resolved_at"])
            return Response(InfoRequestSerializer(req).data)


class VisibleProfileView(APIView):
    """Return a profile representation filtered by visibility and approvals.

    GET params:
      - user_id: target user's id (defaults to self)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user_id = request.query_params.get('user_id')
        target_user = request.user
        if user_id:
            try:
                target_user = get_user_model().objects.get(pk=int(user_id))
            except Exception:
                return Response({"detail": "Target user not found"}, status=404)
        profile = getattr(target_user, 'profile', None)
        if profile is None:
            return Response({"detail": "Profile not found"}, status=404)

        # Serialize using existing serializer
        data = ProfileSerializer(profile).data  # type: ignore

        # Apply visibility filtering
        vis = None
        try:
            vis = ProfileVisibility.objects.get(profile=profile)
        except ProfileVisibility.DoesNotExist:
            vis = None

        if not vis or not isinstance(vis.data, dict):
            return Response(data)

        viewer = request.user

        def has_approval(section_key: str) -> bool:
            return InfoRequest.objects.filter(
                owner=target_user,
                requester=viewer,
                section_key=section_key,
                status=InfoRequest.STATUS_APPROVED,
            ).exists()

        # TODO: integrate friendship when a friendship model exists. For now,
        # treat 'friends' as private for non-owners, unless explicitly approved.
        is_owner = viewer == target_user
        filtered = dict(data)

        for key, level in vis.data.items():
            if key not in filtered:
                continue
            level = (level or '').lower()
            if level == 'public':
                continue
            if is_owner:
                continue
            if has_approval(key):
                continue
            # Hide for friends/private by default (until friendship model added)
            filtered.pop(key, None)

        return Response(filtered)

        if action == "deny":
            if req.owner != request.user:
                return Response({"detail": "Only the owner can deny"}, status=403)
            req.status = InfoRequest.STATUS_DENIED
            req.resolved_at = now
            req.save(update_fields=["status", "resolved_at"])
            return Response(InfoRequestSerializer(req).data)

        if action == "cancel":
            if req.requester != request.user:
                return Response({"detail": "Only the requester can cancel"}, status=403)
            req.status = InfoRequest.STATUS_CANCELLED
            req.resolved_at = now
            req.save(update_fields=["status", "resolved_at"])
            return Response(InfoRequestSerializer(req).data)
