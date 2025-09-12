from django.contrib.auth import get_user_model
from django.urls import reverse
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
        data = {"username": "loginuser", "password": "pass1234"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("_auth_user_id", self.client.session)

    def test_login_invalid_credentials(self):
        User = get_user_model()
        User.objects.create_user(
            username="loginuser", email="login@example.com", password="pass1234"
        )

        url = reverse("login_user")
        data = {"username": "loginuser", "password": "wrongpass"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertNotIn("_auth_user_id", self.client.session)
