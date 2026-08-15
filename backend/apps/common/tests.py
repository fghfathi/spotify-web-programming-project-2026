"""Tests for reusable upload validators (Step 4 + FLAC support)."""

from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings

from .validators import validate_audio_file


class AudioValidatorTests(TestCase):
    def _file(self, name, size=1024, content_type="audio/mpeg"):
        return SimpleUploadedFile(name, b"x" * size, content_type=content_type)

    def test_accepts_existing_formats(self):
        for name in ("song.mp3", "song.wav", "song.m4a"):
            validate_audio_file(self._file(name))  # should not raise

    def test_accepts_flac(self):
        # FLAC (lossless) must be a first-class allowed format now.
        validate_audio_file(self._file("song.flac", content_type="audio/flac"))
        validate_audio_file(self._file("SONG.FLAC"))  # case-insensitive

    def test_rejects_unsupported_extension(self):
        with self.assertRaises(ValidationError):
            validate_audio_file(self._file("song.ogg", content_type="audio/ogg"))

    @override_settings(MAX_AUDIO_UPLOAD_SIZE=1024)
    def test_rejects_oversized_flac(self):
        with self.assertRaises(ValidationError):
            validate_audio_file(self._file("big.flac", size=2048))
