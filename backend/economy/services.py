"""Utility helpers for awarding and deducting coins."""

from __future__ import annotations

from datetime import timedelta
from typing import Any, Optional

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from .models import CoinBalance, CoinTransaction, ReputationMetric


def _max_transaction_abs() -> int:
    return getattr(settings, "ECONOMY_MAX_TRANSACTION_ABS", 50)


def _daily_credit_cap() -> int:
    return getattr(settings, "ECONOMY_MAX_DAILY_CREDIT", 200)


def record_transaction(
    *,
    user,
    amount: int,
    event_type: str,
    reason: str,
    reference_id: Optional[str] = None,
    metadata: Optional[dict[str, Any]] = None,
) -> Optional[CoinTransaction]:
    """Persist a coin transaction, updating the running balance safely."""

    if amount == 0:
        return None
    if abs(amount) > _max_transaction_abs():
        raise ValidationError("Transaction amount exceeds configured maximum.")

    metadata = metadata or {}

    with transaction.atomic():
        if reference_id:
            existing = CoinTransaction.objects.select_for_update().filter(
                event_type=event_type,
                reference_id=reference_id,
            ).first()
            if existing:
                return existing

        now = timezone.now()
        adjusted_amount = amount

        if amount > 0:
            window_start = now - timedelta(hours=24)
            credited = (
                CoinTransaction.objects.filter(
                    user=user,
                    amount__gt=0,
                    created_at__gte=window_start,
                ).aggregate(total=Sum("amount"))["total"]
                or 0
            )
            allowance = max(0, _daily_credit_cap() - int(credited))
            if allowance <= 0:
                return None
            if adjusted_amount > allowance:
                adjusted_amount = allowance
                metadata = {**metadata, "partial": True, "allowed_amount": allowance}

        balance, _ = CoinBalance.objects.select_for_update().get_or_create(user=user)
        new_balance = int(balance.coins) + int(adjusted_amount)
        if new_balance < 0:
            adjusted_amount = -int(balance.coins)
            if adjusted_amount == 0:
                return None
            metadata = {**metadata, "clamped": True}
            new_balance = 0

        transaction_obj = CoinTransaction.objects.create(
            user=user,
            amount=adjusted_amount,
            event_type=event_type,
            reason=reason,
            reference_id=reference_id,
            metadata=metadata,
        )

        balance.coins = new_balance
        balance.save(update_fields=["coins", "updated_at"])

        _update_reputation(user=user, delta=adjusted_amount, occurred_at=now)

    return transaction_obj


def _update_reputation(*, user, delta: int, occurred_at) -> None:
    """Recalculate the derived ``ReputationMetric`` for ``user``."""

    balance = CoinBalance.objects.filter(user=user).first()
    coins = int(balance.coins) if balance else 0
    metric, _ = ReputationMetric.objects.get_or_create(user=user)

    new_score = round(max(coins, 0) ** 0.5, 2)
    momentum = round(delta / max(abs(coins), 1), 4)

    metric.score = new_score
    metric.momentum = momentum
    metric.last_recalculated = occurred_at
    metric.save(update_fields=["score", "momentum", "last_recalculated"])
