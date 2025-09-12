from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterable

from django.contrib.auth import get_user_model

from .models_privacy import Friendship

User = get_user_model()


@dataclass(frozen=True)
class ViewerRole:
    SELF = "self"
    FRIEND = "friend"
    PUBLIC = "public"


def get_viewer_role(viewer, owner_id: int) -> str:
    if not viewer or not viewer.is_authenticated:
        return ViewerRole.PUBLIC
    if viewer.id == owner_id:
        return ViewerRole.SELF
    if Friendship.are_friends(viewer.id, owner_id):
        return ViewerRole.FRIEND
    return ViewerRole.PUBLIC


def is_visible(visibility_level: str, role: str) -> bool:
    if role == ViewerRole.SELF:
        return True
    if visibility_level == "public":
        return True
    if visibility_level == "friends" and role == ViewerRole.FRIEND:
        return True
    return False


DEFAULT_VISIBILITY = "friends"


def build_privacy_filtered_profile(
    *,
    raw_profile_data: Dict[str, Any],
    visibility_map: Dict[str, str] | None,
    viewer,
    owner_id: int,
    allowed_fields: Iterable[str] | None = None,
) -> Dict[str, Any]:
    """
    Returns a new dict with only fields visible to the viewer.
    visibility_map maps field name -> {public|friends|private}. Fields missing default to friends.
    Optionally limit to allowed_fields (e.g., serializer fields).
    """
    role = get_viewer_role(viewer, owner_id)
    visibility_map = visibility_map or {}

    if role == ViewerRole.SELF:
        return {
            k: v
            for k, v in raw_profile_data.items()
            if (not allowed_fields or k in allowed_fields)
        }

    filtered: Dict[str, Any] = {}
    for key, value in raw_profile_data.items():
        if allowed_fields and key not in allowed_fields:
            continue
        level = visibility_map.get(key, DEFAULT_VISIBILITY)
        if is_visible(level, role):
            filtered[key] = value
    return filtered
