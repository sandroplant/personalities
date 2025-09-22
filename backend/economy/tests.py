from __future__ import annotations

import math

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse

from economy.models import CoinBalance, CoinTransaction, ReputationMetric
from economy.services import record_transaction
from questions.models import Answer, Question
from rest_framework import status
from rest_framework.test import APITestCase

from evaluations.models import Criterion


class EconomyServiceTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user("econ", email="econ@example.com", password="pass1234")

    def test_record_transaction_updates_balance_and_reputation(self):
        tx = record_transaction(
            user=self.user,
            amount=9,
            event_type=CoinTransaction.EventType.ANSWER_SUBMITTED,
            reason="test credit",
        )
        self.assertIsNotNone(tx)
        balance = CoinBalance.objects.get(user=self.user)
        self.assertEqual(balance.coins, 9)
        metric = ReputationMetric.objects.get(user=self.user)
        self.assertAlmostEqual(metric.score, round(math.sqrt(9), 2))
        self.assertGreater(metric.momentum, 0)

    @override_settings(ECONOMY_MAX_DAILY_CREDIT=5)
    def test_rate_limit_caps_daily_credit(self):
        first = record_transaction(
            user=self.user,
            amount=4,
            event_type=CoinTransaction.EventType.ANSWER_SUBMITTED,
            reason="first",
        )
        self.assertEqual(first.amount, 4)

        second = record_transaction(
            user=self.user,
            amount=4,
            event_type=CoinTransaction.EventType.ANSWER_SUBMITTED,
            reason="second",
        )
        self.assertIsNotNone(second)
        self.assertEqual(second.amount, 1)
        self.assertTrue(second.metadata.get("partial"))

        third = record_transaction(
            user=self.user,
            amount=4,
            event_type=CoinTransaction.EventType.ANSWER_SUBMITTED,
            reason="third",
        )
        self.assertIsNone(third)

    def test_negative_transaction_clamped_to_balance(self):
        record_transaction(
            user=self.user,
            amount=3,
            event_type=CoinTransaction.EventType.ANSWER_SUBMITTED,
            reason="prefund",
        )
        debit = record_transaction(
            user=self.user,
            amount=-10,
            event_type=CoinTransaction.EventType.QUESTION_CREATED,
            reason="overdraft",
        )
        self.assertEqual(debit.amount, -3)
        self.assertTrue(debit.metadata.get("clamped"))
        balance = CoinBalance.objects.get(user=self.user)
        self.assertEqual(balance.coins, 0)


class EconomyApiIntegrationTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.asker = User.objects.create_user("asker", email="ask@example.com", password="pass1234")
        self.answerer = User.objects.create_user("answer", email="answer@example.com", password="pass1234")
        self.subject = User.objects.create_user("subject", email="subject@example.com", password="pass1234")
        self.criterion = Criterion.objects.create(name="Impact")

    def test_balance_endpoint_returns_user_state(self):
        record_transaction(
            user=self.asker,
            amount=6,
            event_type=CoinTransaction.EventType.ANSWER_SUBMITTED,
            reason="seed",
        )
        self.client.force_authenticate(user=self.asker)
        resp = self.client.get(reverse("economy:balance"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["coins"], 6)
        self.assertIn("reputation", resp.data)

    def test_transactions_endpoint_lists_history(self):
        record_transaction(
            user=self.asker,
            amount=3,
            event_type=CoinTransaction.EventType.ANSWER_SUBMITTED,
            reason="seed",
        )
        self.client.force_authenticate(user=self.asker)
        resp = self.client.get(reverse("economy:transactions"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_question_creation_emits_transaction(self):
        self.client.force_authenticate(user=self.asker)
        resp = self.client.post(
            reverse("question-list-create"),
            {
                "text": "What long-form policy would best solve climate change in the next decade?",
                "question_type": "yesno",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        q_id = resp.data["id"]
        tx = CoinTransaction.objects.get(
            event_type=CoinTransaction.EventType.QUESTION_CREATED,
            reference_id=str(q_id),
        )
        self.assertEqual(tx.user, self.asker)

    def test_answer_submission_emits_transaction(self):
        question = Question.objects.create(
            author=self.asker,
            text="Is renewable energy adoption accelerating?",
            question_type=Question.QuestionType.YES_NO,
        )
        self.client.force_authenticate(user=self.answerer)
        resp = self.client.post(
            reverse("answer-create"),
            {"question_id": question.id, "selected_option_index": 0, "is_anonymous": False},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        answer = Answer.objects.get(question=question, user=self.answerer)
        tx = CoinTransaction.objects.get(
            event_type=CoinTransaction.EventType.ANSWER_SUBMITTED,
            reference_id=str(answer.id),
        )
        self.assertEqual(tx.user, self.answerer)

    def test_evaluation_creation_emits_transactions(self):
        self.client.force_authenticate(user=self.asker)
        resp = self.client.post(
            reverse("evaluation-create"),
            {
                "criterion_id": self.criterion.id,
                "score": 5,
                "subject_id": self.subject.id,
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        evaluation_id = resp.data["id"]
        subject_tx = CoinTransaction.objects.get(
            event_type=CoinTransaction.EventType.EVALUATION_RECEIVED,
            reference_id=f"evaluation:{evaluation_id}",
        )
        self.assertEqual(subject_tx.user, self.subject)
        evaluator_tx = CoinTransaction.objects.get(
            event_type=CoinTransaction.EventType.EVALUATION_GIVEN,
            reference_id=f"evaluation-given:{evaluation_id}",
        )
        self.assertEqual(evaluator_tx.user, self.asker)
