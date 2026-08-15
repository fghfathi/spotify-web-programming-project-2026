"""Playlist models: a user-owned, ordered collection of songs."""

from django.conf import settings
from django.db import models

from apps.common.validators import validate_image_file


class Playlist(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="playlists",
    )
    title = models.CharField(max_length=200)
    cover_image = models.ImageField(
        upload_to="covers/playlists/",
        null=True,
        blank=True,
        validators=[validate_image_file],
    )
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.title} ({self.owner_id})"

    @property
    def track_count(self) -> int:
        return self.items.count()


class PlaylistItem(models.Model):
    """A song's membership in a playlist, with an explicit ordering position."""

    playlist = models.ForeignKey(
        Playlist, on_delete=models.CASCADE, related_name="items"
    )
    song = models.ForeignKey(
        "catalog.Song", on_delete=models.CASCADE, related_name="playlist_items"
    )
    position = models.PositiveIntegerField(default=0)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["position", "added_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["playlist", "song"], name="unique_song_per_playlist"
            )
        ]

    def __str__(self):
        return f"{self.playlist_id}:{self.song_id}"
