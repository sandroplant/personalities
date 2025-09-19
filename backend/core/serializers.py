# core/serializers.py

from django.contrib.auth import authenticate, get_user_model

from rest_framework import serializers

from .models import Message, Post, Profile

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6, style={"input_type": "password"})
    name = serializers.CharField(required=True, max_length=100, write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "name"]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email is already in use.")
        return value

    def create(self, validated_data):
        name = validated_data.pop("name")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)  # Hashes the password
        user.save()
        # Create Profile
        Profile.objects.create(
            user=user,
            full_name=name,
            # Add other default fields if necessary
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True, write_only=True, max_length=255)
    password = serializers.CharField(required=True, write_only=True, style={"input_type": "password"})

    def validate(self, data):
        email = data.get("email")
        password = data.get("password")

        if email and password:
            user = authenticate(request=self.context.get("request"), email=email, password=password)
            if not user:
                raise serializers.ValidationError("Invalid email or password.")
        else:
            raise serializers.ValidationError("Both email and password are required.")

        data["user"] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "spotify_id", "display_name", "email"]  # Adjusted fields
        read_only_fields = ["id", "spotify_id"]  # Marked fields as read-only


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = "__all__"  # Keep all fields for Profile


class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = "__all__"  # Keep all fields for Post


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = "__all__"  # Keep all fields for Message
