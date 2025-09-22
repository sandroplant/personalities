from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from evaluations.models import Criterion, Evaluation
from questions.models import Answer, Question


class QuestionAnswerCountTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user1 = User.objects.create_user("u1", email="u1@example.com", password="pass1234")
        self.user2 = User.objects.create_user("u2", email="u2@example.com", password="pass1234")

    def _auth(self, user):
        self.client.force_authenticate(user=user)

    def test_answer_submission_updates_counts(self):
        """Submitting answers should update yes/no counts in subsequent fetches."""
        self._auth(self.user1)
        create_url = reverse("question-list-create")
        list_url = reverse("question-list-create")
        answer_url = reverse("answer-create")

        # Create a yes/no question
        resp = self.client.post(
            create_url,
            {"text": "Is this a test?", "question_type": "yesno"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        q_id = resp.data["id"]

        # Initial counts should be zero
        resp = self.client.get(list_url)
        question = resp.data["results"][0] if "results" in resp.data else resp.data[0]
        self.assertEqual(question["yes_count"], 0)
        self.assertEqual(question["no_count"], 0)

        # Submit a "Yes" answer as user1
        resp = self.client.post(
            answer_url,
            {"question_id": q_id, "selected_option_index": 0, "is_anonymous": False},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        resp = self.client.get(list_url)
        question = resp.data["results"][0] if "results" in resp.data else resp.data[0]
        self.assertEqual(question["yes_count"], 1)
        self.assertEqual(question["no_count"], 0)

        # Submit a "No" answer as user2
        self._auth(self.user2)
        resp = self.client.post(
            answer_url,
            {"question_id": q_id, "selected_option_index": 1, "is_anonymous": False},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        resp = self.client.get(list_url)
        question = resp.data["results"][0] if "results" in resp.data else resp.data[0]
        self.assertEqual(question["yes_count"], 1)
        self.assertEqual(question["no_count"], 1)


class QuestionReactionApiTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user1 = User.objects.create_user("alpha", email="alpha@example.com", password="pass1234")
        self.user2 = User.objects.create_user("beta", email="beta@example.com", password="pass1234")
        self.question = Question.objects.create(
            author=self.user1,
            text="How do reactions work?",
            question_type=Question.QuestionType.YES_NO,
        )

    def test_reactions_weighted_by_evaluations_and_breakdown(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse("question-reactions", args=[self.question.id])

        # Create a positive reaction from user1
        resp = self.client.post(url, {"quality": 1, "agreement": -1}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.question.refresh_from_db()
        self.assertAlmostEqual(self.question.quality_score, 1.0)
        self.assertAlmostEqual(self.question.agreement_score, -1.0)

        # Give user2 a lower objectivity weight
        criterion = Criterion.objects.create(name="insight")
        evaluation = Evaluation.objects.create(
            evaluator=self.user2,
            subject=self.user1,
            criterion=criterion,
            score=3,
            objectivity_score=0.5,
        )
        Evaluation.objects.filter(pk=evaluation.pk).update(
            objectivity_score=0.5,
            reliability_weight=0.5,
            extreme_rate_weight=1.0,
        )

        # User2 responds with conflicting sentiment which should update the averages
        self.client.force_authenticate(user=self.user2)
        resp = self.client.post(url, {"quality": -1, "agreement": 1, "humor": 1}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        self.question.refresh_from_db()
        expected_quality = (1.0 * 1.0 + -1.0 * 0.5) / (1.0 + 0.5)
        self.assertAlmostEqual(self.question.quality_score, expected_quality)
        self.assertAlmostEqual(self.question.humor_score, (0.0 * 1.0 + 1.0 * 0.5) / (1.0 + 0.5))

        # Fetch breakdown as user2 to confirm user reaction is included
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.data
        self.assertEqual(data["breakdown"]["quality"]["positive"], 1)
        self.assertEqual(data["breakdown"]["quality"]["negative"], 1)
        self.assertEqual(data["user_reaction"]["quality"], -1)

        # Updating the same reaction should not create duplicates
        resp = self.client.post(url, {"quality": 0, "agreement": 0, "humor": -1, "safety": 1}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.question.refresh_from_db()
        self.assertAlmostEqual(self.question.safety_score, (0.0 * 1.0 + 1.0 * 0.5) / (1.0 + 0.5))

    def test_invalid_reaction_value_rejected(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse("question-reactions", args=[self.question.id])
        resp = self.client.post(url, {"quality": 2}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class AnswerReactionApiTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user1 = User.objects.create_user("gamma", email="gamma@example.com", password="pass1234")
        self.user2 = User.objects.create_user("delta", email="delta@example.com", password="pass1234")
        self.question = Question.objects.create(
            author=self.user1,
            text="Sample question",
            question_type=Question.QuestionType.YES_NO,
        )
        self.answer = Answer.objects.create(question=self.question, user=self.user2, selected_option_index=0)

    def test_answer_reaction_basic_flow(self):
        url = reverse("answer-reactions", args=[self.answer.id])
        self.client.force_authenticate(user=self.user1)
        resp = self.client.post(url, {"quality": 1}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.answer.refresh_from_db()
        self.assertEqual(self.answer.quality_score, 1.0)

        # Second submission updates existing row
        resp = self.client.post(url, {"quality": -1, "agreement": -1}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.answer.refresh_from_db()
        self.assertEqual(self.answer.agreement_score, -1.0)
