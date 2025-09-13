"""
Serializers for the questions app. These translate Question and Answer
instances to and from JSON for API consumption.
"""

from rest_framework import serializers

from .models import Answer, Question, Tag


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
    question_type = serializers.ChoiceField(choices=Question.QuestionType.choices)
    options = serializers.JSONField(required=False)

    # These are provided by queryset annotations in the list view.
    yes_count = serializers.IntegerField(read_only=True)
    no_count = serializers.IntegerField(read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    rating_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Question
        fields = [
            "id",
            "text",
            "tag",
            "tag_id",
            "question_type",
            "options",
            "is_anonymous",
            "created_at",
            "yes_count",
            "no_count",
            "average_rating",
            "rating_count",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "yes_count",
            "no_count",
            "average_rating",
            "rating_count",
        ]

    def validate_options(self, value):
        """
        Ensure no more than four answer options are provided and strip empty strings.

        If the incoming value is falsy, return an empty list (for yes/no or rating polls).
        """
        if not value:
            return []
        if len(value) > 4:
            raise serializers.ValidationError("A maximum of 4 options is allowed.")
        cleaned = []
        for opt in value:
            text = str(opt).strip()
            if text:
                cleaned.append(text)
        return cleaned

    def validate(self, attrs):
        """Validate option counts based on question_type."""
        qtype = attrs.get("question_type")
        options = attrs.get("options") or []
        if qtype == Question.QuestionType.MULTIPLE_CHOICE:
            if len(options) < 2:
                raise serializers.ValidationError(
                    {"options": "Multiple choice questions require 2–4 options."}
                )
        else:
            if options:
                raise serializers.ValidationError(
                    {
                        "options": "Options are only allowed for multiple choice questions."
                    }
                )
        return attrs

    def create(self, validated_data):
        # Attach the author from context
        author = self.context["request"].user
        return Question.objects.create(author=author, **validated_data)


class AnswerSerializer(serializers.ModelSerializer):
    """Serializer for creating an answer to a question."""

    question_id = serializers.PrimaryKeyRelatedField(
        queryset=Question.objects.all(), source="question"
    )
    selected_option_index = serializers.IntegerField(required=False, min_value=0)
    rating = serializers.IntegerField(required=False, min_value=1, max_value=10)
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Answer
        fields = [
            "question_id",
            "selected_option_index",
            "rating",
            "is_anonymous",
            "user",
        ]

    def validate(self, attrs):
        """Ensure the answer matches the question type."""
        question: Question = attrs["question"]
        qtype = question.question_type
        option_index = attrs.get("selected_option_index")
        rating = attrs.get("rating")

        if qtype == Question.QuestionType.RATING:
            if rating is None:
                raise serializers.ValidationError(
                    {"rating": "Rating value required for rating questions."}
                )
            if option_index is not None:
                raise serializers.ValidationError(
                    {
                        "selected_option_index": "Option index not used for rating questions."
                    }
                )
        else:
            if option_index is None:
                raise serializers.ValidationError(
                    {
                        "selected_option_index": "Option index required for this question."
                    }
                )
            if rating is not None:
                raise serializers.ValidationError(
                    {"rating": "Rating not allowed for this question."}
                )
            if qtype == Question.QuestionType.YES_NO:
                if option_index not in (0, 1):
                    raise serializers.ValidationError(
                        {
                            "selected_option_index": "Yes/No questions expect option 0 or 1."
                        }
                    )
            elif qtype == Question.QuestionType.MULTIPLE_CHOICE:
                if option_index >= len(question.options):
                    raise serializers.ValidationError(
                        {"selected_option_index": "Invalid option index."}
                    )
        return attrs

    def create(self, validated_data):
        # unique constraint ensures only one answer per user per question
        return Answer.objects.create(**validated_data)
