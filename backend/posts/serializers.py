# posts/serializers.py

from django.contrib.auth import get_user_model

from rest_framework import serializers

from .models import Comment, CommentReaction, Post

User = get_user_model()


class PostSerializer(serializers.ModelSerializer):
    author = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = Post
        fields = [
            "id",
            "author",
            "title",
            "content",
            "likes",
            "shares",
            "tags",
            "external_urls",
            "is_published",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class CommentSerializer(serializers.ModelSerializer):
    author = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = Comment
        fields = [
            "id",
            "post",
            "author",
            "content",
            "created_at",
            "quality_score",
            "agreement_score",
            "humor_score",
            "safety_score",
        ]
        read_only_fields = ["created_at", "quality_score", "agreement_score", "humor_score", "safety_score"]


class CommentReactionSerializer(serializers.ModelSerializer):
    quality = serializers.IntegerField(required=False, min_value=-1, max_value=1)
    agreement = serializers.IntegerField(required=False, min_value=-1, max_value=1)
    humor = serializers.IntegerField(required=False, min_value=-1, max_value=1)
    safety = serializers.IntegerField(required=False, min_value=-1, max_value=1)

    class Meta:
        model = CommentReaction
        fields = ["id", "quality", "agreement", "humor", "safety", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        for field in CommentReaction.DIMENSIONS:
            attrs[field] = int(attrs.get(field, 0))
        return attrs
