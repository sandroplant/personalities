"""Utility helpers for queuing and delivering notifications."""

from __future__ import annotations

from queue import SimpleQueue
from typing import Dict

from django.db import transaction
from django.utils import timezone

from questions.models import Answer
from posts.models import Comment

from .models import CoinBalance, Notification, NotificationPreference


class NotificationDispatcher:
    """Naive in-memory queue that mimics background delivery."""

    _queue: SimpleQueue[int] = SimpleQueue()

    @classmethod
    def enqueue(cls, notification_id: int) -> None:
        cls._queue.put(notification_id)

    @classmethod
    def process(cls) -> None:
        while not cls._queue.empty():
            notification_id = cls._queue.get()
            try:
                notification = Notification.objects.get(pk=notification_id, is_sent=False)
            except Notification.DoesNotExist:  # pragma: no cover - defensive
                continue
            notification.is_sent = True
            notification.sent_at = timezone.now()
            notification.save(update_fields=["is_sent", "sent_at"])


class NotificationService:
    """High level interface for creating notifications with preference checks."""

    @staticmethod
    def _ensure_preferences(user) -> Dict[str, bool]:
        existing = {
            pref.notification_type: pref
            for pref in NotificationPreference.objects.filter(user=user)
        }
        created: Dict[str, bool] = {}
        for choice, _label in Notification.Type.choices:
            if choice not in existing:
                pref = NotificationPreference.objects.create(user=user, notification_type=choice)
                existing[choice] = pref
            created[choice] = existing[choice].enabled
        return created

    @classmethod
    def should_notify(cls, user, notification_type: str) -> bool:
        prefs = cls._ensure_preferences(user)
        return prefs.get(notification_type, True)

    @classmethod
    def _queue_notification(cls, user, notification_type: str, payload: dict | None = None) -> Notification | None:
        if not cls.should_notify(user, notification_type):
            return None
        notification = Notification.objects.create(
            user=user,
            notification_type=notification_type,
            payload=payload or {},
        )
        transaction.on_commit(lambda nid=notification.id: NotificationDispatcher.enqueue(nid))
        return notification

    # ------------------------------------------------------------------
    @classmethod
    def notify_new_answer(cls, answer: Answer) -> None:
        question = answer.question
        if question.author_id == answer.user_id:
            return
        cls._queue_notification(
            question.author,
            Notification.Type.NEW_ANSWER,
            {
                "question_id": question.id,
                "answer_id": answer.id,
                "responder": str(answer.user),
            },
        )

    @classmethod
    def notify_new_comment(cls, comment: Comment) -> None:
        post = comment.post
        if post.author_id == comment.author_id:
            return
        cls._queue_notification(
            post.author,
            Notification.Type.NEW_COMMENT,
            {
                "post_id": post.id,
                "comment_id": comment.id,
                "author": str(comment.author),
            },
        )

    @classmethod
    def notify_evaluation_request(cls, subject, evaluation) -> None:
        cls._queue_notification(
            subject,
            Notification.Type.EVALUATION_REQUEST,
            {
                "evaluation_id": evaluation.id,
                "criterion": getattr(evaluation.criterion, "name", ""),
                "requestor": str(evaluation.evaluator),
            },
        )

    @classmethod
    def adjust_coins(cls, user, delta: int, reason: str) -> None:
        balance, _ = CoinBalance.objects.get_or_create(user=user)
        balance.balance += delta
        balance.save(update_fields=["balance"])
        cls._queue_notification(
            user,
            Notification.Type.COIN_CHANGE,
            {
                "delta": delta,
                "balance": balance.balance,
                "reason": reason,
            },
        )


def batch_process_notifications() -> None:
    """Helper for tests or management commands to flush the queue."""

    NotificationDispatcher.process()
    pending_ids = list(Notification.objects.filter(is_sent=False).values_list("id", flat=True))
    for notification_id in pending_ids:
        NotificationDispatcher.enqueue(notification_id)
    NotificationDispatcher.process()
