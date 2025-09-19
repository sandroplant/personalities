# userprofiles/serializers.py

from django.contrib.auth import get_user_model

from rest_framework import serializers

from .models import Profile


PROFILE_FIELD_NAMES = [
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


UserModel = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserModel
        fields = ["id", "username", "email"]


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = Profile
        fields = ["user", *PROFILE_FIELD_NAMES]


class ProfileUpdateSerializer(serializers.ModelSerializer):
    visibility = serializers.DictField(required=False, write_only=True)

    class Meta:
        model = Profile
        fields = [*PROFILE_FIELD_NAMES, "visibility"]

    def validate_visibility(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Visibility settings must be a mapping of field names to levels.")

        allowed_fields = set(PROFILE_FIELD_NAMES)
        normalized: dict[str, str | None] = {}
        invalid_fields = sorted(set(value.keys()) - allowed_fields)
        if invalid_fields:
            raise serializers.ValidationError(
                {"fields": [f"Unknown visibility field(s): {', '.join(invalid_fields)}"]}
            )

        for key, raw_level in value.items():
            if raw_level is None:
                normalized[key] = None
                continue
            level = str(raw_level).lower()
            if level not in {"public", "friends", "private"}:
                raise serializers.ValidationError(
                    {key: "Visibility level must be one of: public, friends, private."}
                )
            normalized[key] = level

        return normalized

    def validate(self, attrs):
        allowed = set(PROFILE_FIELD_NAMES)
        incoming_keys = set(getattr(self, "initial_data", {}).keys())
        unknown = sorted(incoming_keys - allowed - {"visibility"})
        if unknown:
            raise serializers.ValidationError(
                {field: ["This field is not recognized."] for field in unknown}
            )
        return super().validate(attrs)
