from django.contrib.auth.models import AbstractUser
from django.db import models


# Custom User Model
class User(AbstractUser):
    email = models.EmailField(unique=True)  # Ensuring email is unique

    def __str__(self):
        return self.username


# Profile Model
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    full_name = models.CharField(max_length=100)
    bio = models.TextField(blank=True, max_length=500)
    criteria = models.JSONField(default=dict)
    spotify_info = models.JSONField(default=dict)
    favorite_movies = models.JSONField(default=list)
    favorite_books = models.JSONField(default=list)
    appearance = models.JSONField(default=dict)
    hobbies = models.JSONField(default=list)
    interests = models.JSONField(default=list)
    profession = models.CharField(max_length=100, blank=True)
    education = models.CharField(max_length=100, blank=True)
    privacy_settings = models.JSONField(default=dict)

    def __str__(self):
        return f"{self.full_name}'s Profile"


# Message Model
class Message(models.Model):
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_messages"
    )
    recipient = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="received_messages"
    )
    content = models.TextField(max_length=1000)
    ai_response = models.TextField(blank=True, max_length=2000)
    is_mystery_message = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Message from {self.sender.username} to {self.recipient.username}"


# Post Model
class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    title = models.CharField(max_length=200)
    content = models.TextField(max_length=5000)
    likes = models.PositiveIntegerField(default=0)
    shares = models.PositiveIntegerField(default=0)
    tags = models.JSONField(default=list)
    external_urls = models.JSONField(default=dict)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


# Comment Model for better scalability
class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    content = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.author.username} on {self.post.title}"
