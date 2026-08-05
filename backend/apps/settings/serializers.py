"""Settings serializer.

Reads/writes the DB model while presenting the shape the frontend already
uses (types/settings.ts): a nested `notifications` object and a `volume`
expressed on a 0-100 scale, plus the extra Step-5 fields (theme, quality,
shuffle, repeat, last-played resume point)."""

from rest_framework import serializers

from .models import UserSettings


class UserSettingsSerializer(serializers.ModelSerializer):
    # Frontend-facing volume on a 0-100 scale, mapped to the 0.0-1.0 float.
    volume = serializers.SerializerMethodField()
    notifications = serializers.JSONField(
        source="notification_preferences", required=False
    )
    defaultPlaybackQuality = serializers.CharField(
        source="default_playback_quality", required=False
    )
    playbackVolume = serializers.FloatField(
        source="playback_volume", required=False
    )
    shuffleEnabled = serializers.BooleanField(
        source="shuffle_enabled", required=False
    )
    repeatMode = serializers.CharField(source="repeat_mode", required=False)
    lastPlayedSongId = serializers.PrimaryKeyRelatedField(
        source="last_played_song", read_only=True
    )
    lastPlaybackPosition = serializers.FloatField(
        source="last_playback_position", required=False, allow_null=True
    )

    class Meta:
        model = UserSettings
        fields = [
            "theme",
            "language",
            "defaultPlaybackQuality",
            "volume",
            "playbackVolume",
            "shuffleEnabled",
            "repeatMode",
            "lastPlayedSongId",
            "lastPlaybackPosition",
            "notifications",
        ]

    def get_volume(self, obj):
        return round((obj.playback_volume or 0) * 100)

    def to_internal_value(self, data):
        # Accept a 0-100 `volume` from the frontend and translate it to the
        # stored 0.0-1.0 float before the model validators run.
        validated = super().to_internal_value(data)
        if "volume" in data:
            try:
                validated["playback_volume"] = max(
                    0.0, min(1.0, float(data["volume"]) / 100.0)
                )
            except (TypeError, ValueError):
                pass
        return validated
