from __future__ import annotations

from django.apps import apps
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from evaluations.models import Criterion, Evaluation
from notifications.services import NotificationService, batch_process_notifications
from posts.models import Post, Comment
from questions.models import Answer, Question, Tag

User = get_user_model()


class NotificationFlowTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="owner", email="owner@example.com", password="pw")
        self.friend = User.objects.create_user(username="friend", email="friend@example.com", password="pw")
        self.tag = Tag.objects.create(name="music")
        self.post = Post.objects.create(author=self.owner, title="Hello", content="World")
        self.question = Question.objects.create(author=self.owner, text="Fav song?", tag=self.tag)

    def _flush(self):
        batch_process_notifications()

    def test_new_answer_triggers_notification(self):
        Answer.objects.create(question=self.question, user=self.friend, selected_option_index=0)
        self._flush()
        Notification = apps.get_model("notifications", "Notification")
        note = Notification.objects.filter(user=self.owner, notification_type=Notification.Type.NEW_ANSWER).first()
        self.assertIsNotNone(note)
        self.assertTrue(note.is_sent)

    def test_comment_notification_respects_preferences(self):
        NotificationPreference = apps.get_model("notifications", "NotificationPreference")
        Notification = apps.get_model("notifications", "Notification")
        NotificationPreference.objects.update_or_create(
            user=self.owner,
            notification_type=Notification.Type.NEW_COMMENT,
            defaults={"enabled": False},
        )
        Comment.objects.create(post=self.post, author=self.friend, content="Nice!")
        self._flush()
        self.assertFalse(
            Notification.objects.filter(user=self.owner, notification_type=Notification.Type.NEW_COMMENT).exists()
        )

    def test_evaluation_request_and_coin_change(self):
        criterion = Criterion.objects.create(name="Charisma")
        evaluation = Evaluation.objects.create(evaluator=self.friend, subject=self.owner, criterion=criterion, score=4)
        NotificationService.notify_evaluation_request(self.owner, evaluation)
        NotificationService.adjust_coins(self.friend, 5, "bonus")
        self._flush()
        Notification = apps.get_model("notifications", "Notification")
        eval_note = Notification.objects.filter(
            user=self.owner, notification_type=Notification.Type.EVALUATION_REQUEST
        ).first()
        coin_note = Notification.objects.filter(user=self.friend, notification_type=Notification.Type.COIN_CHANGE).first()
        self.assertIsNotNone(eval_note)
        self.assertIsNotNone(coin_note)
        self.assertEqual(coin_note.payload.get("balance"), 5)


class NotificationPreferenceApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="pref", email="pref@example.com", password="pw")
        self.client.force_login(self.user)

    def test_get_and_update_preferences(self):
        url = reverse("notification-preferences")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        payload = resp.json()
        self.assertTrue(any(pref["notification_type"] == "new_answer" for pref in payload))
        patch_resp = self.client.patch(url, {"notification_type": "new_answer", "enabled": False}, content_type="application/json")
        self.assertEqual(patch_resp.status_code, 204)
        NotificationPreference = apps.get_model("notifications", "NotificationPreference")
        pref = NotificationPreference.objects.get(user=self.user, notification_type="new_answer")
        self.assertFalse(pref.enabled)
