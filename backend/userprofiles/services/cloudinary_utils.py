from __future__ import annotations

from typing import Optional

from django.conf import settings

from cloudinary.uploader import upload as _cloudinary_upload


class CloudinaryConfigError(Exception):
    """Raised when Cloudinary credentials are missing."""


ALLOWED_IMAGE_EXTS = {"jpg", "jpeg", "png", "webp", "gif"}


def has_valid_image_type(filename: str, content_type: Optional[str]) -> bool:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_IMAGE_EXTS:
        return False
    if not content_type:
        return True  # some test files won't set it; rely on extension
    return content_type.startswith("image/")


def ensure_config() -> None:
    name = getattr(settings, "CLOUDINARY_CLOUD_NAME", None)
    key = getattr(settings, "CLOUDINARY_API_KEY", None)
    secret = getattr(settings, "CLOUDINARY_API_SECRET", None)
    if not (name and key and secret):
        raise CloudinaryConfigError("Cloudinary credentials are missing.")


def upload_profile_image(file_obj, public_id: str):
    """
    Thin wrapper so tests can mock a single call site.
    """
    return _cloudinary_upload(
        file_obj,
        public_id=public_id,
        folder="profiles",
        resource_type="image",
        overwrite=True,
    )
