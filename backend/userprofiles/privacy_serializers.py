from rest_framework import serializers
from django.contrib.auth import get_user_model
from .privacy_models import ProfileVisibility, InfoRequest


class ProfileVisibilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileVisibility
        fields = ["id", "data", "updated_at"]
        read_only_fields = ["id", "updated_at"]


class InfoRequestSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    requester = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = InfoRequest
        fields = [
            "id",
            "owner",
            "requester",
            "section_key",
            "status",
            "created_at",
            "resolved_at",
        ]
        read_only_fields = [
            "id",
            "owner",
            "requester",
            "status",
            "created_at",
            "resolved_at",
        ]


class InfoRequestCreateSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    requester = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = InfoRequest
        fields = ["id", "owner", "requester", "section_key"]

