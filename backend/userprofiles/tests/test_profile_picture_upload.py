import os
from unittest import mock

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.test import TestCase

from rest_framework.test import APIClient

from userprofiles.models import Profile


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.django_project.settings_test")


User = get_user_model()


class UploadProfilePictureTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="user", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = reverse("upload_profile_picture")

    def test_upload_profile_picture_success(self):
        upload_url = "https://res.cloudinary.com/demo/image/upload/sample.jpg"

        image = SimpleUploadedFile(
            "avatar.jpg",
            b"fake image data",
            content_type="image/jpeg",
        )

        with mock.patch.dict(os.environ, {"CLOUDINARY_URL": "cloudinary://key:secret@cloud"}):
            with mock.patch("userprofiles.views.uploader.upload", return_value={"secure_url": upload_url}) as mock_upload:
                response = self.client.post(
                    self.url,
                    {"profilePicture": image},
                    format="multipart",
                )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["url"], upload_url)
        mock_upload.assert_called_once()

        profile = Profile.objects.get(user=self.user)
        self.assertEqual(profile.profile_picture, upload_url)

    def test_upload_profile_picture_invalid_type(self):
        file_obj = SimpleUploadedFile(
            "document.txt",
            b"not an image",
            content_type="text/plain",
        )

        with mock.patch.dict(os.environ, {"CLOUDINARY_URL": "cloudinary://key:secret@cloud"}):
            with mock.patch("userprofiles.views.uploader.upload") as mock_upload:
                response = self.client.post(
                    self.url,
                    {"profilePicture": file_obj},
                    format="multipart",
                )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"], "Unsupported file type")
        mock_upload.assert_not_called()

    def test_upload_profile_picture_missing_credentials(self):
        image = SimpleUploadedFile(
            "avatar.png",
            b"fake image data",
            content_type="image/png",
        )

        missing_env = {
            "CLOUDINARY_URL": "",
            "CLOUDINARY_CLOUD_NAME": "",
            "CLOUDINARY_API_KEY": "",
            "CLOUDINARY_API_SECRET": "",
        }

        with mock.patch.dict(os.environ, missing_env, clear=False):
            with mock.patch("userprofiles.views.uploader.upload") as mock_upload:
                response = self.client.post(
                    self.url,
                    {"profilePicture": image},
                    format="multipart",
                )

        self.assertEqual(response.status_code, 500)
        self.assertEqual(
            response.json()["error"],
            "Cloudinary credentials are not configured",
        )
        mock_upload.assert_not_called()
