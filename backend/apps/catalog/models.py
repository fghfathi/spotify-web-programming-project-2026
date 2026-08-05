"""Catalog models: Album and Song (artists' published works).

Media files are stored on disk via FileField/ImageField with format+size
validators (Step 4). The API returns absolute URLs to these files.
"""

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.accounts.models import UserRole
from apps.common.validators import validate_audio_file, validate_image_file


class Album(models.Model):
    artist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="albums",
        limit_choices_to={"role": UserRole.ARTIST},
    )
    title = models.CharField(max_length=200)
    cover_image = models.ImageField(
        upload_to="covers/albums/",
        null=True,
        blank=True,
        validators=[validate_image_file],
    )
    release_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-release_date", "-created_at"]

    def __str__(self):
        return f"{self.title} — {self.artist_id}"


class Song(models.Model):
    """A single track. It is a "single" when `album` is null."""

    artist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="songs",
        limit_choices_to={"role": UserRole.ARTIST},
    )
    album = models.ForeignKey(
        Album,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="songs",
    )
    collaborators = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="collaborations",
        limit_choices_to={"role": UserRole.ARTIST},
    )

    title = models.CharField(max_length=200)
    audio_file = models.FileField(
        upload_to="songs/", validators=[validate_audio_file]
    )
    cover_image = models.ImageField(
        upload_to="covers/songs/",
        null=True,
        blank=True,
        validators=[validate_image_file],
    )
    duration_seconds = models.PositiveIntegerField(
        default=0, validators=[MinValueValidator(0)]
    )
    genre = models.CharField(max_length=80, blank=True)
    lyrics = models.TextField(blank=True)
    release_date = models.DateField()

    # Gold-tier "early access to new songs" support.
    is_early_access = models.BooleanField(default=False)
    early_access_unlock_date = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-release_date", "-created_at"]

    def __str__(self):
        return self.title

    @property
    def release_type(self) -> str:
        return "album" if self.album_id else "single"

    @property
    def plays_count(self) -> int:
        related = getattr(self, "stream_events", None)
        return related.count() if related is not None else 0

    @property
    def duration_display(self) -> str:
        total = int(self.duration_seconds or 0)
        return f"{total // 60}:{total % 60:02d}"
