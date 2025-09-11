from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase


class UserAuthTests(APITestCase):
    def test_user_registration(self):
        url = reverse("register_user")
        data = {
            "username": "tester",
            "email": "tester@example.com",
            "password": "securepass123",
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        User = get_user_model()
        self.assertTrue(User.objects.filter(username="tester").exists())
        user = User.objects.get(username="tester")
        self.assertTrue(user.check_password("securepass123"))

    def test_user_login(self):
        User = get_user_model()
        User.objects.create_user(
            username="loginuser", email="login@example.com", password="pass1234"
        )

        url = reverse("login_user")
        data = {"email": "login@example.com", "password": "pass1234"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("_auth_user_id", self.client.session)

