"""
Serializers for the questions app.  These translate Question and Answer
instances to and from JSON for API consumption.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Tag, Question, Answer


class TagSerializer(serializers.ModelSerializer):
    """Serializer for question tags."""

    class Meta:
        model = Tag
        fields = ["id", "name"]


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for listing questions with aggregated answer counts."""

    tag = TagSerializer(read_only=True)
    tag_id = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), source="tag", write_only=True, required=False
    )
    options = serializers.JSONField(required=False)
    yes_count = serializers.SerializerMethodField()
    no_count = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            "id",
            "text",
            "tag",
            "tag_id",
            "options",
            "is_anonymous",
            "created_at",
            "yes_count",
            "no_count",
        ]
        read_only_fields = ["id", "created_at", "yes_count", "no_count"]

    def get_yes_count(self, obj: Question) -> int:
        """Return the number of answers selecting index 0 (Yes)."""
        return obj.answers.filter(selected_option_index=0).count()

    def get_no_count(self, obj: Question) -> int:
        """Return the number of answers selecting index 1 (No)."""
        return obj.answers.filter(selected_option_index=1).count()

    def create(self, validated_data):
        # Attach the author from context
        author = self.context["request"].user
        return Question.objects.create(author=author, **validated_data)


class AnswerSerializer(serializers.ModelSerializer):
    """Serializer for creating an answer to a question."""

    question_id = serializers.PrimaryKeyRelatedField(
        queryset=Question.objects.all(), source="question"
    )
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Answer
        fields = ["question_id", "selected_option_index", "is_anonymous", "user"]

    def create(self, validated_data):
        # unique constraint ensures only one answer per user per question
        return Answer.objects.create(**validated_data)
