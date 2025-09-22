"""Signal handlers that populate feed events."""

from __future__ import annotations

from django.db.models.signals import post_save
from django.dispatch import receiver

from posts.models import Comment
from questions.models import Answer, Question

from notifications.services import NotificationService

from .services import record_answer_event, record_question_event, record_reaction_event


@receiver(post_save, sender=Question)
def create_question_event(sender, instance: Question, created: bool, **kwargs):
    if created:
        record_question_event(instance)


@receiver(post_save, sender=Answer)
def create_answer_event(sender, instance: Answer, created: bool, **kwargs):
    if created:
        record_answer_event(instance)
        NotificationService.notify_new_answer(instance)


@receiver(post_save, sender=Comment)
def create_comment_event(sender, instance: Comment, created: bool, **kwargs):
    if created:
        record_reaction_event(instance)
        NotificationService.notify_new_comment(instance)
