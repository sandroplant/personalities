from __future__ import annotations

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from questions.models import Answer, Question, Tag
from userprofiles.models import Friendship, Profile

User = get_user_model()


class FeedRankingTests(TestCase):
    def setUp(self):
        self.author = User.objects.create_user(username="author", email="author@example.com", password="pw")
        self.friend = User.objects.create_user(username="friend", email="friend@example.com", password="pw")
        self.other = User.objects.create_user(username="other", email="other@example.com", password="pw")
        self.viewer = User.objects.create_user(username="viewer", email="viewer@example.com", password="pw")
        Profile.objects.create(user=self.viewer, interests="music politics")
        Friendship.objects.create(from_user=self.viewer, to_user=self.friend, is_confirmed=True)
        Friendship.objects.create(from_user=self.friend, to_user=self.viewer, is_confirmed=True)
        self.music_tag = Tag.objects.create(name="music")
        self.sports_tag = Tag.objects.create(name="sports")

    def test_friend_events_rank_higher_with_interest_match(self):
        question = Question.objects.create(author=self.friend, text="Fav song?", tag=self.music_tag)
        Answer.objects.create(question=question, user=self.friend, selected_option_index=0)

        from feed.services import FeedService

        service = FeedService(self.viewer)
        ranked = service.get_ranked_events()
        self.assertGreaterEqual(len(ranked), 1)
        top_event = ranked[0]
        self.assertEqual(top_event.event.actor, self.friend)
        self.assertGreater(top_event.score, 1.0)

    def test_ranking_fallback_without_profile_or_social_context(self):
        question = Question.objects.create(author=self.other, text="Best sport?", tag=self.sports_tag)
        from feed.services import FeedService

        ranked_for_author = FeedService(self.author).get_ranked_events()
        self.assertTrue(ranked_for_author)
        self.assertGreater(ranked_for_author[0].score, 0.0)

    def test_feed_endpoint_returns_ranked_events(self):
        Question.objects.create(author=self.friend, text="Fav song?", tag=self.music_tag)
        self.client.force_login(self.viewer)
        url = reverse("personalized-feed")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIsInstance(payload, list)
