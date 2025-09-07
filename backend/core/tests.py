"""API tests for user profile operations."""

from django.urls import reverse
from django.contrib.auth import get_user_model
from django.apps import apps
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
