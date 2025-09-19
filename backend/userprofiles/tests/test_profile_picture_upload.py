import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "django_project.settings_test")

from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from userprofiles.models import Profile

User = get_user_model()


class UploadProfilePictureTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="user", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = reverse("upload_profile_picture")

    @override_settings(
        CLOUDINARY_CLOUD_NAME="demo",
        CLOUDINARY_API_KEY="key",
        CLOUDINARY_API_SECRET="secret",
    )
    @patch(
        "userprofiles.views.upload_profile_image",
        return_value={"secure_url": "https://res.cloudinary.com/demo/image/upload/sample.jpg"},
    )
    def test_upload_profile_picture_success(self, mock_upload):
        image = SimpleUploadedFile(
            "avatar.jpg",
            b"\xff\xd8\xff",  # minimal jpeg header bytes
            content_type="image/jpeg",
        )
        response = self.client.post(self.url, {"profilePicture": image}, format="multipart")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["url"],
            "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        )
        mock_upload.assert_called_once()

        profile = Profile.objects.get(user=self.user)
        self.assertEqual(
            profile.profile_picture,
            "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        )

    @patch("userprofiles.views.upload_profile_image")
    def test_upload_profile_picture_invalid_type(self, mock_upload):
        file_obj = SimpleUploadedFile(
            "document.txt",
            b"not an image",
            content_type="text/plain",
        )
        response = self.client.post(self.url, {"profilePicture": file_obj}, format="multipart")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"], "Invalid file type")
        mock_upload.assert_not_called()

    @override_settings(
        CLOUDINARY_CLOUD_NAME="",
        CLOUDINARY_API_KEY="",
        CLOUDINARY_API_SECRET="",
    )
    @patch("userprofiles.views.upload_profile_image")
    def test_upload_profile_picture_missing_credentials(self, mock_upload):
        image = SimpleUploadedFile(
            "avatar.png",
            b"\x89PNG\r\n\x1a\n",  # minimal png header bytes
            content_type="image/png",
        )
        response = self.client.post(self.url, {"profilePicture": image}, format="multipart")

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json()["error"], "Cloudinary not configured")
        mock_upload.assert_not_called()
