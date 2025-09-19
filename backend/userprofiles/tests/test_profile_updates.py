import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate

from userprofiles.models import Profile
from userprofiles.privacy_models import InfoRequest, ProfileVisibility
from userprofiles.privacy_views import VisibleProfileView

pytestmark = pytest.mark.django_db

User = get_user_model()


def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def test_update_profile_accepts_whitelisted_fields():
    user = User.objects.create_user(username="person", email="person@example.com", password="pw")
    client = auth_client(user)

    url = "/userprofiles/profile/update/"
    payload = {"bio": "Hello there", "hobbies": "Hiking"}

    response = client.post(url, payload, format="json")
    assert response.status_code == 200

    profile = Profile.objects.get(user=user)
    assert profile.bio == "Hello there"
    assert profile.hobbies == "Hiking"
    assert response.data["bio"] == "Hello there"
    assert response.data["hobbies"] == "Hiking"


def test_update_profile_rejects_unknown_fields():
    user = User.objects.create_user(username="reject", email="reject@example.com", password="pw")
    client = auth_client(user)

    url = "/userprofiles/profile/update/"
    response = client.post(url, {"unknown_field": "nope"}, format="json")

    assert response.status_code == 400
    assert "unknown_field" in response.data


def test_update_profile_updates_visibility_settings():
    user = User.objects.create_user(username="visible", email="visible@example.com", password="pw")
    client = auth_client(user)

    url = "/userprofiles/profile/update/"
    payload = {"visibility": {"bio": "Public", "hobbies": "private"}}

    response = client.post(url, payload, format="json")
    assert response.status_code == 200

    profile = Profile.objects.get(user=user)
    visibility = ProfileVisibility.objects.get(profile=profile)
    assert visibility.data == {"bio": "public", "hobbies": "private"}


def test_visible_profile_respects_private_fields_and_approvals():
    owner = User.objects.create_user(username="owner", email="owner@example.com", password="pw")
    viewer = User.objects.create_user(username="viewer", email="viewer@example.com", password="pw")

    profile = Profile.objects.create(user=owner, bio="Keep secret", hobbies="Reading")
    ProfileVisibility.objects.create(profile=profile, data={"bio": "private", "hobbies": "friends"})

    factory = APIRequestFactory()
    request = factory.get("/visible/", {"user_id": owner.id})
    force_authenticate(request, user=viewer)

    response = VisibleProfileView.as_view()(request)
    assert response.status_code == 200
    assert "bio" not in response.data
    assert "hobbies" not in response.data

    InfoRequest.objects.create(
        owner=owner,
        requester=viewer,
        section_key="bio",
        status=InfoRequest.STATUS_APPROVED,
    )

    request = factory.get("/visible/", {"user_id": owner.id})
    force_authenticate(request, user=viewer)
    response = VisibleProfileView.as_view()(request)
    assert response.status_code == 200
    assert response.data.get("bio") == "Keep secret"
