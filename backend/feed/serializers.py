"""Serializers for presenting feed events via the API."""

from __future__ import annotations

from rest_framework import serializers

from .models import FeedEvent


class FeedEventSerializer(serializers.ModelSerializer):
    score = serializers.FloatField(read_only=True)
    tag = serializers.CharField(source="tag.name", allow_null=True, read_only=True)
    question_text = serializers.CharField(source="question.text", allow_null=True, read_only=True)
    answer_rating = serializers.IntegerField(source="answer.rating", allow_null=True, read_only=True)
    comment_text = serializers.CharField(source="comment.content", allow_null=True, read_only=True)

    actor = serializers.SerializerMethodField()

    def get_actor(self, obj: FeedEvent) -> str:
        return str(obj.actor)

    class Meta:
        model = FeedEvent
        fields = [
            "id",
            "event_type",
            "actor",
            "tag",
            "question_text",
            "answer_rating",
            "comment_text",
            "created_at",
            "score",
        ]
        read_only_fields = fields
