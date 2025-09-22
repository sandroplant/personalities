from __future__ import annotations

from typing import Iterable

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from core.reactions import compute_weighted_scores, DIMENSIONS

from .models import Comment, CommentReaction


def _reaction_rows(queryset) -> Iterable[dict]:
    return queryset.values("user_id", *DIMENSIONS)


def _update_comment_scores(comment_id: int) -> None:
    queryset = CommentReaction.objects.filter(comment_id=comment_id)
    rows = list(_reaction_rows(queryset))
    user_ids = {row["user_id"] for row in rows}
    scores = compute_weighted_scores(rows, user_ids=user_ids)
    Comment.objects.filter(id=comment_id).update(**{f"{key}_score": value for key, value in scores.items()})


@receiver(post_save, sender=CommentReaction)
@receiver(post_delete, sender=CommentReaction)
def comment_reaction_changed(sender, instance: CommentReaction, **kwargs) -> None:
    _update_comment_scores(instance.comment_id)
