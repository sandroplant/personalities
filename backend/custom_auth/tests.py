from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from userprofiles.models import Profile


class AuthViewTests(APITestCase):
    def test_register_creates_user_and_profile(self):
        url = reverse("register")
        payload = {"username": "new_user", "password": "secure-pass-123"}

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", response.data)
        self.assertTrue(get_user_model().objects.filter(username="new_user").exists())
        self.assertTrue(Profile.objects.filter(user__username="new_user").exists())

    def test_duplicate_register_returns_conflict(self):
        user_model = get_user_model()
        user_model.objects.create_user(username="taken", password="secure-pass-123")

        url = reverse("register")
        payload = {"username": "taken", "password": "secure-pass-123"}

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data.get("error"), "Username already exists")

    def test_login_returns_jwt_token(self):
        user_model = get_user_model()
        user_model.objects.create_user(username="login_user", password="secure-pass-123")

        url = reverse("login")
        payload = {"username": "login_user", "password": "secure-pass-123"}

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)

    def test_login_invalid_credentials(self):
        url = reverse("login")
        payload = {"username": "unknown", "password": "wrong-pass"}

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data.get("error"), "Invalid credentials")
