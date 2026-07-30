"""Catalog models: Album and Song (the artists' published works).

An artist publishes either Singles (a Song with no album) or Albums (a set of
Songs). Media files are stored on disk via FileField/ImageField; the API
returns their URLs.
"""

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.accounts.models import UserRole


class Album(models.Model):
    artist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="albums",
        limit_choices_to={"role": UserRole.ARTIST},
    )
    title = models.CharField(max_length=200)
    cover_image = models.ImageField(upload_to="albums/covers/", null=True, blank=True)
    release_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-release_date", "-created_at"]

    def __str__(self):
        return f"{self.title} — {self.artist_id}"


class Song(models.Model):
    """A single track. It is a "single" when `album` is null, otherwise an
    album track."""

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
    # Featured artists on the track.
    collaborators = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="collaborations",
        limit_choices_to={"role": UserRole.ARTIST},
    )

    title = models.CharField(max_length=200)
    audio_file = models.FileField(upload_to="songs/audio/")
    cover_image = models.ImageField(upload_to="songs/covers/", null=True, blank=True)
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
        # Derived from stream events (the streaming app is added in step 3.2).
        related = getattr(self, "stream_events", None)
        return related.count() if related is not None else 0
