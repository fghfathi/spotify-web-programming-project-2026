"""Reusable file/image validators for uploaded media (Step 4).

These enforce both the file extension (format) and a maximum size, returning
clear, user-facing error messages. They are attached to model FileField /
ImageField definitions and also run again in serializers so that DRF surfaces
400 responses with descriptive detail.
"""

import os

from django.conf import settings
from django.core.exceptions import ValidationError


def _human_size(num_bytes: int) -> str:
    """Return a compact human-readable size, e.g. '20 MB'."""
    mb = num_bytes / (1024 * 1024)
    if mb >= 1:
        return f"{mb:.0f} MB"
    kb = num_bytes / 1024
    return f"{kb:.0f} KB"


def _validate_extension(uploaded_file, allowed_extensions):
    ext = os.path.splitext(uploaded_file.name)[1].lower().lstrip(".")
    if ext not in allowed_extensions:
        allowed = ", ".join(f".{e}" for e in allowed_extensions)
        raise ValidationError(
            f"Unsupported file type '.{ext}'. Allowed formats: {allowed}."
        )


def _validate_size(uploaded_file, max_bytes):
    size = getattr(uploaded_file, "size", None)
    if size is not None and size > max_bytes:
        raise ValidationError(
            f"File is too large ({_human_size(size)}). "
            f"Maximum allowed size is {_human_size(max_bytes)}."
        )


def validate_audio_file(uploaded_file):
    """Validate an uploaded audio file: extension and max size."""
    _validate_extension(uploaded_file, settings.ALLOWED_AUDIO_EXTENSIONS)
    _validate_size(uploaded_file, settings.MAX_AUDIO_UPLOAD_SIZE)


def validate_image_file(uploaded_file):
    """Validate an uploaded image file: extension and max size."""
    _validate_extension(uploaded_file, settings.ALLOWED_IMAGE_EXTENSIONS)
    _validate_size(uploaded_file, settings.MAX_IMAGE_UPLOAD_SIZE)
