# posts/serializers.py

from django.contrib.auth import get_user_model

from rest_framework import serializers

from .models import Comment, Post

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
        fields = ["id", "post", "author", "content", "created_at"]
        read_only_fields = ["created_at"]
