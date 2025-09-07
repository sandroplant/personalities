# userprofiles/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = Profile
        fields = [
            "user",
            "bio",
            "profile_picture",
            # Basic info
            "age_group",
            "gender_identity",
            "pronouns",
            "nationality",
            "languages",
            "location_city",
            "location_state",
            "location_country",
            "zodiac_sign",
            # Physical traits
            "eye_color",
            "hair_color",
            "hair_style",
            "height",
            "weight",
            "body_type",
            "skin_tone",
            "tattoos_piercings",
            # Background
            "education_level",
            "field_of_study",
            "profession",
            "job_title",
            "industry",
            # Lifestyle & habits
            "diet",
            "exercise_frequency",
            "smoking",
            "drinking",
            "pets",
            # Hobbies & interests
            "hobbies",
            # Favorites
            "favorite_songs",
            "favorite_artists",
            "favorite_books",
            "favorite_movies",
            "favorite_tv_shows",
            "favorite_food",
            "favorite_travel_destinations",
            "favorite_sport",
            "favorite_podcasts",
            "favorite_influencers",
            # Personality & values
            "personality_values",
            # Fun & miscellaneous
            "fun_fact",
            "goals",
            "achievements",
            "personal_quote",
            "social_links",
        ]
