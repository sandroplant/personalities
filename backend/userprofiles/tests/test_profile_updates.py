import uuid

from django.conf import settings
from django.contrib.auth import get_user_model

import pytest
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate

from userprofiles.models import Friendship, Profile
from userprofiles.privacy_models import InfoRequest, ProfileVisibility
from userprofiles.privacy_views import VisibleProfileView

pytestmark = pytest.mark.django_db

User = get_user_model()

if "testserver" not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append("testserver")


def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def create_user(prefix: str):
    suffix = uuid.uuid4().hex
    return User.objects.create_user(
        username=f"{prefix}_{suffix}",
        email=f"{prefix}_{suffix}@example.com",
        password="pw",
    )


def test_update_profile_accepts_whitelisted_fields():
    user = create_user("person")
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
    user = create_user("reject")
    client = auth_client(user)

    url = "/userprofiles/profile/update/"
    response = client.post(url, {"unknown_field": "nope"}, format="json")

    assert response.status_code == 400
    assert "unknown_field" in response.data


def test_update_profile_updates_visibility_settings():
    user = create_user("visible")
    client = auth_client(user)

    url = "/userprofiles/profile/update/"
    payload = {"visibility": {"bio": "Public", "hobbies": "private"}}

    response = client.post(url, payload, format="json")
    assert response.status_code == 200

    profile = Profile.objects.get(user=user)
    visibility = ProfileVisibility.objects.get(profile=profile)
    assert visibility.data == {"bio": "public", "hobbies": "private"}


def _make_visible_request(viewer, target_user_id=None):
    factory = APIRequestFactory()
    params = {"user_id": target_user_id} if target_user_id is not None else {}
    request = factory.get("/visible/", params)
    force_authenticate(request, user=viewer)
    return VisibleProfileView.as_view()(request)


def test_visible_profile_self_view_shows_full_profile():
    owner = create_user("self")
    profile = Profile.objects.create(user=owner, bio="Self bio", hobbies="Self hobbies")
    ProfileVisibility.objects.create(profile=profile, data={"bio": "private", "hobbies": "private"})

    response = _make_visible_request(owner)

    assert response.status_code == 200
    assert response.data["bio"] == "Self bio"
    assert response.data["hobbies"] == "Self hobbies"


def test_visible_profile_friend_view_requires_mutual_confirmation():
    owner = create_user("owner")
    viewer = create_user("viewer")
    profile = Profile.objects.create(
        user=owner,
        bio="Friends only bio",
        favorite_movies="Public movies",
        hobbies="Private hobbies",
    )
    ProfileVisibility.objects.create(
        profile=profile,
        data={"bio": "friends", "favorite_movies": "public", "hobbies": "private"},
    )

    # One-sided confirmation should not elevate the viewer to friend tier.
    Friendship.objects.create(from_user=owner, to_user=viewer, is_confirmed=True)
    response = _make_visible_request(viewer, owner.id)
    assert response.status_code == 200
    assert "bio" not in response.data
    assert response.data.get("favorite_movies") == "Public movies"
    assert "hobbies" not in response.data

    # Mutual confirmation unlocks friend-tier visibility.
    Friendship.objects.create(from_user=viewer, to_user=owner, is_confirmed=True)
    response = _make_visible_request(viewer, owner.id)
    assert response.status_code == 200
    assert response.data.get("bio") == "Friends only bio"
    assert response.data.get("favorite_movies") == "Public movies"
    assert "hobbies" not in response.data


def test_visible_profile_approved_request_overrides_private_fields():
    owner = create_user("owner2")
    viewer = create_user("viewer2")
    profile = Profile.objects.create(
        user=owner,
        bio="Private bio",
        favorite_movies="Public movies",
        hobbies="Friends hobbies",
    )
    ProfileVisibility.objects.create(
        profile=profile,
        data={"bio": "private", "favorite_movies": "public", "hobbies": "friends"},
    )

    response = _make_visible_request(viewer, owner.id)
    assert response.status_code == 200
    assert response.data.get("favorite_movies") == "Public movies"
    assert "bio" not in response.data
    assert "hobbies" not in response.data

    InfoRequest.objects.create(
        owner=owner,
        requester=viewer,
        section_key="bio",
        status=InfoRequest.STATUS_APPROVED,
    )

    response = _make_visible_request(viewer, owner.id)
    assert response.status_code == 200
    assert response.data.get("bio") == "Private bio"
    assert "hobbies" not in response.data


def test_visible_profile_public_view_restricted_to_public_fields():
    owner = create_user("owner3")
    viewer = create_user("viewer3")
    profile = Profile.objects.create(
        user=owner,
        bio="Friends bio",
        favorite_movies="Public movies",
        hobbies="Private hobbies",
    )
    ProfileVisibility.objects.create(
        profile=profile,
        data={"bio": "friends", "favorite_movies": "public", "hobbies": "private"},
    )

    response = _make_visible_request(viewer, owner.id)
    assert response.status_code == 200
    assert response.data.get("favorite_movies") == "Public movies"
    assert "bio" not in response.data
    assert "hobbies" not in response.data
