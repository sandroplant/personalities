"""API tests for user profile operations."""

from django.apps import apps
from django.contrib.auth import get_user_model
from django.urls import resolve, reverse
from rest_framework import status
from rest_framework.test import APITestCase


class ProfileAPITest(APITestCase):
    """Ensure profile endpoints operate correctly for authenticated users."""

    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username="tester",
            email="test@example.com",
            password="secret",
        )
        Profile = apps.get_model("core", "Profile")
        self.profile = Profile.objects.create(user=self.user, full_name="Test User")
        self.client.force_authenticate(user=self.user)

    def test_get_user_profile(self):
        response = self.client.get(reverse("get_user_profile"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["full_name"], "Test User")

    def test_update_user_profile(self):
        data = {"full_name": "Updated User", "bio": "Updated bio"}
        response = self.client.put(
            reverse("update_user_profile"),
            data,
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.full_name, "Updated User")
        self.assertEqual(self.profile.bio, "Updated bio")


class ProfileSessionAPITest(APITestCase):
    """Verify the session-backed profile API endpoints."""

    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username="session-user",
            email="session@example.com",
            password="secret",
        )
        Profile = apps.get_model("core", "Profile")
        self.profile = Profile.objects.create(user=self.user, full_name="Session User")

    def _login(self):
        logged_in = self.client.login(username="session-user", password="secret")
        self.assertTrue(logged_in)

    def test_session_routes_use_session_views(self):
        get_func = resolve(reverse("get_user_profile_api")).func
        update_func = resolve(reverse("update_user_profile_api")).func

        self.assertEqual(get_func.__module__, "core.profile_session_views")
        self.assertEqual(update_func.__module__, "core.profile_session_views")

    def test_get_profile_requires_session(self):
        response = self.client.get(reverse("get_user_profile_api"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_profile_returns_data_for_logged_in_user(self):
        self._login()
        response = self.client.get(reverse("get_user_profile_api"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["full_name"], "Session User")

    def test_update_profile_via_session(self):
        self._login()
        payload = {"full_name": "Updated Session", "bio": "Via session"}
        response = self.client.post(
            reverse("update_user_profile_api"), payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.full_name, "Updated Session")
        self.assertEqual(self.profile.bio, "Via session")
