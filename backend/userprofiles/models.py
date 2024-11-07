# userprofiles/models.py

from django.conf import settings
from django.db import models

class SpotifyProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='userprofile_spotify_profile'  # Updated to avoid conflict
    )
    display_name = models.CharField(max_length=100)
    email = models.EmailField()
    images = models.JSONField()  # Store user images from Spotify

    def __str__(self):
        return self.display_name

class Profile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='userprofile_profile'  # Updated to avoid conflict
    )
    bio = models.TextField(blank=True)
    profile_picture = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"
