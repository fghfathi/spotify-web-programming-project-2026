"""User preferences persisted in the database so they sync across devices
(Step 5). One row per user, created automatically on registration by a signal.
"""

from django.conf import settings
from django.db import models


def default_notification_preferences():
    """Mirror the frontend's NotificationSettings defaults (types/settings.ts)."""
    return {"enabled": True, "frequency": "important", "dailyLimit": 10}


class UserSettings(models.Model):
    class Theme(models.TextChoices):
        LIGHT = "light", "Light"
        DARK = "dark", "Dark"
        SYSTEM = "system", "System"

    class Language(models.TextChoices):
        EN = "en", "English"
        FA = "fa", "Persian"

    class Quality(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    class RepeatMode(models.TextChoices):
        NONE = "none", "None"
        ONE = "one", "One"
        ALL = "all", "All"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="settings",
    )
    theme = models.CharField(
        max_length=10, choices=Theme.choices, default=Theme.DARK
    )
    language = models.CharField(
        max_length=5, choices=Language.choices, default=Language.EN
    )
    default_playback_quality = models.CharField(
        max_length=10, choices=Quality.choices, default=Quality.MEDIUM
    )
    # Stored as a float in [0.0, 1.0].
    playback_volume = models.FloatField(default=0.7)
    shuffle_enabled = models.BooleanField(default=False)
    repeat_mode = models.CharField(
        max_length=5, choices=RepeatMode.choices, default=RepeatMode.NONE
    )
    last_played_song = models.ForeignKey(
        "catalog.Song",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    last_playback_position = models.FloatField(null=True, blank=True)
    notification_preferences = models.JSONField(
        default=default_notification_preferences
    )
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Settings<{self.user_id}>"
