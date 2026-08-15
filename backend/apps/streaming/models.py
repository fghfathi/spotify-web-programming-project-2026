"""Streaming model: a StreamEvent is recorded each time a user plays a track.

Aggregates (plays_count on Song, totalStreams/totalListeners on an artist,
dailyStreams on a user) are all derived from these rows, so there is a single
source of truth for play analytics.
"""

from django.conf import settings
from django.db import models


class StreamEvent(models.Model):
    # The listener who played the track.
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="stream_events",
    )
    song = models.ForeignKey(
        "catalog.Song",
        on_delete=models.CASCADE,
        related_name="stream_events",
    )
    # Denormalized owning artist so per-artist aggregates avoid a join.
    artist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="stream_events_received",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["song", "created_at"]),
            models.Index(fields=["artist", "created_at"]),
        ]

    def __str__(self):
        return f"{self.user_id} played {self.song_id}"
