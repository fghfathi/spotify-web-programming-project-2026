"""Playlist models.

A playlist belongs to a user and holds an ordered list of songs through the
`PlaylistTrack` join table (position preserved for playback). Playlist-count
and cover-image limits per subscription tier are enforced at the API layer in
step 3.2.
"""

from django.conf import settings
from django.db import models

from apps.catalog.models import Song


class Playlist(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="playlists",
    )
    title = models.CharField(max_length=200)
    # Cover upload is a Silver/Gold-only feature (enforced at the API layer).
    cover_image = models.ImageField(
        upload_to="playlists/covers/", null=True, blank=True
    )
    songs = models.ManyToManyField(
        Song, through="PlaylistTrack", related_name="playlists"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.owner_id})"

    @property
    def track_count(self) -> int:
        return self.tracks.count()


class PlaylistTrack(models.Model):
    """Ordered membership of a song within a playlist."""

    playlist = models.ForeignKey(
        Playlist, on_delete=models.CASCADE, related_name="tracks"
    )
    song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name="+")
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
        return f"{self.playlist_id}:{self.song_id}@{self.position}"
