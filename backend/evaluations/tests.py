from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from evaluations.models import Criterion, Evaluation
from evaluations.views import REPEAT_DAYS
from rest_framework.test import APITestCase
from userprofiles.models import Friendship


class EvaluationTasksViewTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username="rater", email="rater@example.com", password="pw"
        )
        self.friend = User.objects.create_user(
            username="friend", email="friend@example.com", password="pw"
        )
        self.stranger = User.objects.create_user(
            username="stranger", email="stranger@example.com", password="pw"
        )
        self.criterion = Criterion.objects.create(name="Kindness")

    def _auth(self):
        self.client.force_authenticate(user=self.user)

    def test_only_confirmed_friends_queued(self):
        Friendship.objects.create(
            from_user=self.user, to_user=self.friend, is_confirmed=True
        )
        Friendship.objects.create(
            from_user=self.user, to_user=self.stranger, is_confirmed=False
        )
        self._auth()
        response = self.client.get(reverse("evaluation-tasks"))
        self.assertEqual(response.status_code, 200)
        tasks = response.data["tasks"]
        subject_ids = {t["subjectId"] for t in tasks}
        self.assertIn(self.friend.id, subject_ids)
        self.assertNotIn(self.stranger.id, subject_ids)

    def test_completed_ratings_not_duplicated(self):
        Friendship.objects.create(
            from_user=self.user, to_user=self.friend, is_confirmed=True
        )
        Evaluation.objects.create(
            evaluator=self.user,
            subject=self.friend,
            criterion=self.criterion,
            score=5,
            familiarity=5,
        )
        self._auth()

        # Recent rating should exclude the pair
        response = self.client.get(reverse("evaluation-tasks"))
        tasks = response.data["tasks"]
        pairs = {(t["subjectId"], t["criterionId"]) for t in tasks}
        self.assertNotIn((self.friend.id, self.criterion.id), pairs)

        # Backdate the evaluation beyond repeat interval, expect requeue
        Evaluation.objects.filter(
            evaluator=self.user,
            subject=self.friend,
            criterion=self.criterion,
        ).update(created_at=timezone.now() - timedelta(days=REPEAT_DAYS + 1))

        response = self.client.get(reverse("evaluation-tasks"))
        tasks = response.data["tasks"]
        pairs = {(t["subjectId"], t["criterionId"]) for t in tasks}
        self.assertIn((self.friend.id, self.criterion.id), pairs)

    def test_repeat_evaluation_allowed_after_cooldown(self):
        Friendship.objects.create(
            from_user=self.user, to_user=self.friend, is_confirmed=True
        )
        self._auth()

        url = reverse("evaluation-create") + f"?subject_id={self.friend.id}"

        data = {
            "subject_id": self.friend.id,
            "criterion_id": self.criterion.id,
            "score": 5,
            "familiarity": 5,
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 201)

        Evaluation.objects.filter(
            evaluator=self.user,
            subject=self.friend,
            criterion=self.criterion,
        ).update(created_at=timezone.now() - timedelta(days=REPEAT_DAYS + 1))

        data2 = {
            "subject_id": self.friend.id,
            "criterion_id": self.criterion.id,
            "score": 4,
        }
        response = self.client.post(url, data2)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            Evaluation.objects.filter(
                evaluator=self.user,
                subject=self.friend,
                criterion=self.criterion,
            ).count(),
            2,
        )
