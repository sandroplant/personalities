# custom_auth/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from posts.models import Post


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]  # Include fields as needed


class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "content",
            "author",
        ]  # Include fields as needed
