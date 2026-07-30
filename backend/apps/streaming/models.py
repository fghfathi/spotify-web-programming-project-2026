"""Stream events: one row per play.

This is the raw signal behind several derived numbers:
- a song's `plays_count`,
- an artist's total streams and unique listeners,
- a user's daily stream count (for the Basic tier's 60/day limit),
- monthly artist-reward calculations (support/finance, later step).
"""

from django.conf import settings
from django.db import models


class StreamEvent(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="stream_events",
    )
    song = models.ForeignKey(
        "catalog.Song", on_delete=models.CASCADE, related_name="stream_events"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["song", "created_at"]),
        ]

    def __str__(self):
        return f"{self.user_id} played {self.song_id}"
