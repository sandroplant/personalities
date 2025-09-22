"""Serializers exposing the economy state."""

from __future__ import annotations

from rest_framework import serializers

from .models import CoinBalance, CoinTransaction, ReputationMetric


class ReputationMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReputationMetric
        fields = ["score", "momentum", "last_recalculated"]


class CoinBalanceSerializer(serializers.ModelSerializer):
    reputation = ReputationMetricSerializer(source="user.reputation_metric", read_only=True)

    class Meta:
        model = CoinBalance
        fields = ["coins", "updated_at", "reputation"]


class CoinTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoinTransaction
        fields = [
            "id",
            "amount",
            "event_type",
            "reason",
            "reference_id",
            "metadata",
            "created_at",
        ]
