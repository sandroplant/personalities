"""Core ranking logic for personalized feeds."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List

from django.db.models import QuerySet
from django.utils import timezone

from userprofiles.models import Friendship, Profile

from .models import FeedEvent


@dataclass
class RankedEvent:
    """Wrapper to expose events with precomputed ranking score."""

    event: FeedEvent
    score: float


class FeedRanker:
    """Calculate heuristic scores for feed events."""

    SOCIAL_FRIEND_WEIGHT = 1.5
    SOCIAL_SELF_WEIGHT = 1.2
    SOCIAL_DEFAULT_WEIGHT = 1.0

    INTEREST_MATCH_WEIGHT = 1.3
    INTEREST_RECENT_BOOST_HOURS = 12

    QUALITY_FLOOR = 0.5

    def __init__(self, user):
        self.user = user
        self._profile_cache = None

    # ------------------------------------------------------------------
    def _profile(self) -> Profile | None:
        if self._profile_cache is None:
            try:
                self._profile_cache = Profile.objects.get(user=self.user)
            except Profile.DoesNotExist:
                self._profile_cache = None
        return self._profile_cache

    # ------------------------------------------------------------------
    def _social_weight(self, event: FeedEvent) -> float:
        if event.actor_id == self.user.id:
            return self.SOCIAL_SELF_WEIGHT
        if Friendship.are_friends(self.user.id, event.actor_id):
            return self.SOCIAL_FRIEND_WEIGHT
        return self.SOCIAL_DEFAULT_WEIGHT

    def _interest_weight(self, event: FeedEvent) -> float:
        profile = self._profile()
        if not profile or not event.tag_id:
            return 1.0
        interest_blob = (profile.interests or "") + " " + (profile.hobbies or "")
        if interest_blob:
            tag_name = (event.tag.name or "").lower()
            if tag_name and tag_name in interest_blob.lower():
                return self.INTEREST_MATCH_WEIGHT
        return 1.0

    def _recency_boost(self, event: FeedEvent) -> float:
        if not event.created_at:
            return 1.0
        delta = timezone.now() - event.created_at
        if delta.total_seconds() <= self.INTEREST_RECENT_BOOST_HOURS * 3600:
            return 1.1
        return 1.0

    def score_event(self, event: FeedEvent) -> float:
        social = self._social_weight(event)
        interest = self._interest_weight(event)
        recency = self._recency_boost(event)
        quality = max(event.quality_score, self.QUALITY_FLOOR)
        return event.base_score * social * interest * recency + quality


class FeedService:
    """Public entry point for obtaining personalized feed results."""

    def __init__(self, user):
        self.user = user
        self.ranker = FeedRanker(user)

    def _candidate_events(self) -> QuerySet[FeedEvent]:
        return FeedEvent.objects.select_related(
            "actor",
            "tag",
            "question__tag",
            "answer__question__tag",
            "comment__post",
        )

    def get_ranked_events(self, limit: int = 50) -> List[RankedEvent]:
        events: Iterable[FeedEvent] = self._candidate_events()[: limit * 2]
        ranked: List[RankedEvent] = []
        for event in events:
            derived_tag = event.tag
            if not derived_tag:
                if event.answer and event.answer.question and event.answer.question.tag:
                    derived_tag = event.answer.question.tag
                elif event.question and event.question.tag:
                    derived_tag = event.question.tag
            if derived_tag and event.tag_id != derived_tag.id:
                event.tag = derived_tag
            score = self.ranker.score_event(event)
            ranked.append(RankedEvent(event=event, score=score))
        ranked.sort(key=lambda entry: entry.score, reverse=True)
        return ranked[:limit]


def record_question_event(question) -> FeedEvent:
    """Create a feed event when a question is asked."""

    base_score = 1.0
    quality = 1.0 + float(question.answers.count())
    return FeedEvent.objects.create(
        event_type=FeedEvent.EventType.QUESTION,
        actor=question.author,
        question=question,
        tag=question.tag,
        base_score=base_score,
        quality_score=quality,
    )


def record_answer_event(answer) -> FeedEvent:
    """Create a feed event for new answers."""

    question = answer.question
    quality = 1.0
    if answer.rating is not None:
        quality += float(answer.rating) / 10.0
    return FeedEvent.objects.create(
        event_type=FeedEvent.EventType.ANSWER,
        actor=answer.user,
        answer=answer,
        tag=question.tag,
        base_score=1.2,
        quality_score=quality,
    )


def record_reaction_event(comment) -> FeedEvent:
    """Record a reaction event for post comments."""

    base_score = 0.8
    return FeedEvent.objects.create(
        event_type=FeedEvent.EventType.REACTION,
        actor=comment.author,
        comment=comment,
        base_score=base_score,
        quality_score=1.0,
    )
