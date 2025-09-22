from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APITestCase

from questions.models import Question
from userprofiles.models import Profile


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

    @override_settings(
        QUESTIONS_DAILY_FREE_LIMIT=2,
        QUESTIONS_PAID_COIN_COST=4,
        QUESTIONS_TARGETED_COIN_COST=6,
        QUESTIONS_COIN_PRICE="1.00",
    )
    def test_daily_free_allowance_and_coin_deduction(self):
        self.user1.coin_balance = 12
        self.user1.save(update_fields=["coin_balance"])

        self._auth(self.user1)
        create_url = reverse("question-list-create")

        for idx in range(2):
            resp = self.client.post(
                create_url,
                {"text": f"Free question {idx}", "question_type": "yesno"},
                format="json",
            )
            self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
            self.assertTrue(resp.data["used_free_allowance"])
            self.assertEqual(resp.data["coins_spent"], 0)

        resp = self.client.post(
            create_url,
            {"text": "Paid question", "question_type": "yesno"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertFalse(resp.data["used_free_allowance"])
        self.assertEqual(resp.data["coins_spent"], 4)
        self.assertEqual(resp.data["price_spent"], "4.00")

        self.user1.refresh_from_db()
        self.assertEqual(self.user1.coin_balance, 8)

    @override_settings(
        QUESTIONS_DAILY_FREE_LIMIT=1,
        QUESTIONS_PAID_COIN_COST=3,
        QUESTIONS_COIN_PRICE="1.00",
    )
    def test_quota_resets_next_day(self):
        self.user1.coin_balance = 9
        self.user1.save(update_fields=["coin_balance"])

        self._auth(self.user1)
        create_url = reverse("question-list-create")

        resp = self.client.post(
            create_url,
            {"text": "First", "question_type": "yesno"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(resp.data["used_free_allowance"])

        resp = self.client.post(
            create_url,
            {"text": "Second", "question_type": "yesno"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertFalse(resp.data["used_free_allowance"])

        Question.objects.filter(author=self.user1).update(
            quota_date=timezone.localdate() - timedelta(days=1),
            used_free_allowance=True,
        )

        resp = self.client.post(
            create_url,
            {"text": "Third", "question_type": "yesno"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(resp.data["used_free_allowance"])

        self.user1.refresh_from_db()
        # Only one paid question should have been charged
        self.assertEqual(self.user1.coin_balance, 6)

    @override_settings(QUESTIONS_DAILY_FREE_LIMIT=2, QUESTIONS_TARGETED_COIN_COST=5)
    def test_targeting_requires_matching_profiles(self):
        Profile.objects.create(user=self.user2, age_group="18-24", location_country="US")

        self._auth(self.user1)
        create_url = reverse("question-list-create")

        resp = self.client.post(
            create_url,
            {
                "text": "Targeted", 
                "question_type": "yesno",
                "targeting_criteria": {"age_group": ["30-40"]},
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

        resp = self.client.post(
            create_url,
            {
                "text": "Targeted", 
                "question_type": "yesno",
                "targeting_criteria": {"age_group": ["18-24"], "location_country": "US"},
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["eligible_responder_count"], 1)

    def test_spending_report_endpoint(self):
        self.user1.coin_balance = 20
        self.user1.save(update_fields=["coin_balance"])

        self._auth(self.user1)
        create_url = reverse("question-list-create")

        self.client.post(
            create_url,
            {"text": "Free Q", "question_type": "yesno"},
            format="json",
        )

        with override_settings(QUESTIONS_DAILY_FREE_LIMIT=0, QUESTIONS_PAID_COIN_COST=5, QUESTIONS_COIN_PRICE="2.00"):
            resp = self.client.post(
                create_url,
                {"text": "Paid Q", "question_type": "yesno"},
                format="json",
            )
            self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        report_url = reverse("question-spending-report")
        resp = self.client.get(report_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["total_coins_spent"], 5)
        self.assertEqual(Decimal(resp.data["total_price_spent"]), Decimal("10.00"))
        self.assertEqual(resp.data["eligible_responder_total"], 0)

    def test_targeting_report_lists_questions(self):
        Profile.objects.create(user=self.user2, age_group="21-25")
        self._auth(self.user1)
        create_url = reverse("question-list-create")

        self.client.post(
            create_url,
            {
                "text": "Targeted Q", 
                "question_type": "yesno",
                "targeting_criteria": {"age_group": ["21-25"]},
            },
            format="json",
        )

        report_url = reverse("question-targeting-report")
        resp = self.client.get(report_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data["results"] if isinstance(resp.data, dict) and "results" in resp.data else resp.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["eligible_responder_count"], 1)
