import json

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient

from backend.userprofiles.models_privacy import Friendship, ProfileRequest


pytestmark = pytest.mark.django_db
User = get_user_model()


def auth_client(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c


def test_friendship_create_and_list():
    a = User.objects.create_user(username="a", password="x")
    b = User.objects.create_user(username="b", password="x")
    c = auth_client(a)
    url = reverse("friendship-list")
    res = c.post(url, {"user_a": a.id, "user_b": b.id}, format="json")
    assert res.status_code == 201

    res = c.get(url)
    assert res.status_code == 200
    assert len(res.data) == 1


def test_profile_request_lifecycle():
    owner = User.objects.create_user(username="owner", password="x")
    req = User.objects.create_user(username="req", password="x")
    c = auth_client(req)
    url = reverse("profile-request-list")
    res = c.post(url, {"owner": owner.id, "section": "favorite_movies"}, format="json")
    assert res.status_code == 201
    rid = res.data["id"]

    # Owner approves
    c_owner = auth_client(owner)
    approve_url = reverse("profile-request-approve", args=[rid])
    res = c_owner.post(approve_url)
    assert res.status_code == 200
    assert res.data["status"] == ProfileRequest.STATUS_APPROVED

    # Requester can cancel only when pending; now it should fail
    cancel_url = reverse("profile-request-cancel", args=[rid])
    res = c.post(cancel_url)
    assert res.status_code == 400

