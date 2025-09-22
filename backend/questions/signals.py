from __future__ import annotations

from typing import Iterable

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from core.reactions import compute_weighted_scores, DIMENSIONS

from .models import Answer, AnswerReaction, Question, QuestionReaction


def _reaction_rows(queryset) -> Iterable[Dict[str, int]]:
    return queryset.values("user_id", *DIMENSIONS)


def _update_question_scores(question_id: int) -> None:
    queryset = QuestionReaction.objects.filter(question_id=question_id)
    rows = list(_reaction_rows(queryset))
    user_ids = {row["user_id"] for row in rows}
    scores = compute_weighted_scores(rows, user_ids=user_ids)
    Question.objects.filter(id=question_id).update(**{f"{key}_score": value for key, value in scores.items()})


def _update_answer_scores(answer_id: int) -> None:
    queryset = AnswerReaction.objects.filter(answer_id=answer_id)
    rows = list(_reaction_rows(queryset))
    user_ids = {row["user_id"] for row in rows}
    scores = compute_weighted_scores(rows, user_ids=user_ids)
    Answer.objects.filter(id=answer_id).update(**{f"{key}_score": value for key, value in scores.items()})


@receiver(post_save, sender=QuestionReaction)
@receiver(post_delete, sender=QuestionReaction)
def question_reaction_changed(sender, instance: QuestionReaction, **kwargs) -> None:
    _update_question_scores(instance.question_id)


@receiver(post_save, sender=AnswerReaction)
@receiver(post_delete, sender=AnswerReaction)
def answer_reaction_changed(sender, instance: AnswerReaction, **kwargs) -> None:
    _update_answer_scores(instance.answer_id)
