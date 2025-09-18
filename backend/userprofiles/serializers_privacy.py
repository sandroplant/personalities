from __future__ import annotations

from typing import Any, Dict

from django.contrib.auth import get_user_model

from rest_framework import serializers

from .models_privacy import Friendship, ProfileRequest

User = get_user_model()


class FriendshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Friendship
        fields = ["id", "user_a", "user_b", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        a = attrs.get("user_a")
        b = attrs.get("user_b")
        if a == b:
            raise serializers.ValidationError("Cannot befriend yourself.")
        # Canonical ordering in model.save(); no extra checks here.
        return attrs


class ProfileRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileRequest
        fields = [
            "id",
            "owner",
            "requester",
            "section",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status", "created_at", "updated_at", "requester"]

    def create(self, validated_data):
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")
        owner = validated_data["owner"]
        if owner == request.user:
            raise serializers.ValidationError("Cannot request your own profile.")
        # Implicit requester is the current user
        validated_data["requester"] = request.user
        return super().create(validated_data)


class ProfileRequestStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileRequest
        fields = ["status"]

    def validate_status(self, value: str) -> str:
        if value not in {
            ProfileRequest.STATUS_APPROVED,
            ProfileRequest.STATUS_DENIED,
            ProfileRequest.STATUS_CANCELLED,
        }:
            raise serializers.ValidationError("Invalid status transition.")
        return value
