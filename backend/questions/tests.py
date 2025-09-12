from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class QuestionAnswerCountTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user1 = User.objects.create_user(
            "u1", email="u1@example.com", password="pass1234"
        )
        self.user2 = User.objects.create_user(
            "u2", email="u2@example.com", password="pass1234"
        )

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
