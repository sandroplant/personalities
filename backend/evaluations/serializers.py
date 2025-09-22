from django.contrib.auth import get_user_model

from rest_framework import serializers

from .models import ClarificationMessage, ClarificationThread, Criterion, Evaluation


class CriterionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Criterion
        fields = ["id", "name"]


class EvaluationSerializer(serializers.ModelSerializer):
    evaluator = serializers.ReadOnlyField(source="evaluator.id")
    subject = serializers.ReadOnlyField(source="subject.id")

    # Read-only nested criterion for responses
    criterion = CriterionSerializer(read_only=True)

    # Write-only relation IDs for creates/updates
    criterion_id = serializers.PrimaryKeyRelatedField(
        queryset=Criterion.objects.all(),
        source="criterion",
        write_only=True,
    )
    subject_id = serializers.PrimaryKeyRelatedField(
        queryset=get_user_model().objects.all(),
        source="subject",
        write_only=True,
    )

    class Meta:
        model = Evaluation
        fields = [
            "id",
            "evaluator",
            "subject",
            "criterion",
            "criterion_id",
            "subject_id",
            "score",
            "familiarity",
            "comment",
            "comment_is_anonymous",
            "self_awareness_flag",
            "expected_peer_score",
            "divergence_comment",
            "normalized_score",
            "pending",
            "rater_mean",
            "rater_stddev",
            "reliability_weight",
            "extreme_rate_weight",
            "objectivity_score",
            "created_at",
        ]
        read_only_fields = (
            "id",
            "evaluator",
            "subject",
            "criterion",
            "normalized_score",
            "pending",
            "rater_mean",
            "rater_stddev",
            "reliability_weight",
            "extreme_rate_weight",
            "objectivity_score",
            "created_at",
        )


class ClarificationMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClarificationMessage
        fields = ("id", "sender_role", "body", "is_anonymous", "created_at")
        read_only_fields = ("id", "sender_role", "created_at")


class ClarificationThreadSerializer(serializers.ModelSerializer):
    messages = ClarificationMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ClarificationThread
        fields = (
            "id",
            "evaluation_id",
            "pending_response",
            "is_closed",
            "created_at",
            "updated_at",
            "messages",
        )
        read_only_fields = fields
