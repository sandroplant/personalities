# userprofiles/models.py

from __future__ import annotations

from django.conf import settings
from django.db import models


class SpotifyProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="userprofile_spotify_profile",
    )
    display_name = models.CharField(max_length=100)
    email = models.EmailField()
    images = models.JSONField()

    def __str__(self) -> str:
        return self.display_name


class Profile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="userprofile_profile",
    )
    # Basic info
    bio = models.TextField(blank=True)
    profile_picture = models.URLField(blank=True, null=True)
    age_group = models.CharField(max_length=50, blank=True, null=True)
    gender_identity = models.CharField(max_length=50, blank=True, null=True)
    pronouns = models.CharField(max_length=50, blank=True, null=True)
    nationality = models.CharField(max_length=50, blank=True, null=True)
    languages = models.CharField(max_length=100, blank=True, null=True)
    location_city = models.CharField(max_length=50, blank=True, null=True)
    location_state = models.CharField(max_length=50, blank=True, null=True)
    location_country = models.CharField(max_length=50, blank=True, null=True)
    zodiac_sign = models.CharField(max_length=50, blank=True, null=True)

    # Physical traits
    eye_color = models.CharField(max_length=50, blank=True, null=True)
    hair_color = models.CharField(max_length=50, blank=True, null=True)
    hair_style = models.CharField(max_length=50, blank=True, null=True)
    height = models.CharField(max_length=10, blank=True, null=True)
    weight = models.CharField(max_length=10, blank=True, null=True)
    body_type = models.CharField(max_length=50, blank=True, null=True)
    skin_tone = models.CharField(max_length=50, blank=True, null=True)
    tattoos_piercings = models.CharField(max_length=100, blank=True, null=True)

    # Background
    education_level = models.CharField(max_length=100, blank=True, null=True)
    field_of_study = models.CharField(max_length=100, blank=True, null=True)
    profession = models.CharField(max_length=100, blank=True, null=True)
    job_title = models.CharField(max_length=100, blank=True, null=True)
    industry = models.CharField(max_length=100, blank=True, null=True)

    # Lifestyle & habits
    diet = models.CharField(max_length=50, blank=True, null=True)
    exercise_frequency = models.CharField(max_length=50, blank=True, null=True)
    smoking = models.CharField(max_length=50, blank=True, null=True)
    drinking = models.CharField(max_length=50, blank=True, null=True)
    pets = models.CharField(max_length=100, blank=True, null=True)

    # Hobbies & interests
    hobbies = models.TextField(blank=True, null=True)

    # Favorites
    favorite_songs = models.CharField(max_length=200, blank=True, null=True)
    favorite_artists = models.CharField(max_length=200, blank=True, null=True)
    favorite_books = models.CharField(max_length=200, blank=True, null=True)
    favorite_movies = models.CharField(max_length=200, blank=True, null=True)
    favorite_tv_shows = models.CharField(max_length=200, blank=True, null=True)
    favorite_food = models.CharField(max_length=200, blank=True, null=True)
    favorite_travel_destinations = models.CharField(max_length=200, blank=True, null=True)
    favorite_sport = models.CharField(max_length=100, blank=True, null=True)
    favorite_podcasts = models.CharField(max_length=200, blank=True, null=True)
    favorite_influencers = models.CharField(max_length=200, blank=True, null=True)

    # Personality & values
    personality_values = models.JSONField(blank=True, null=True)

    # Fun & miscellaneous
    fun_fact = models.CharField(max_length=255, blank=True, null=True)
    goals = models.CharField(max_length=255, blank=True, null=True)
    achievements = models.CharField(max_length=255, blank=True, null=True)
    personal_quote = models.CharField(max_length=255, blank=True, null=True)
    social_links = models.TextField(blank=True, null=True)

    def __str__(self) -> str:
        return f"{self.user.username}'s Profile"


class Friendship(models.Model):
    from_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="friendships_sent",
    )
    to_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="friendships_received",
    )
    is_confirmed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("from_user", "to_user")
        verbose_name = "Friendship"
        verbose_name_plural = "Friendships"

    def __str__(self) -> str:
        return f"{self.from_user_id} -> {self.to_user_id}"


# Ensure privacy models are registered with the app
try:
    from .privacy_models import InfoRequest, ProfileVisibility  # noqa: F401
except Exception:
    pass
