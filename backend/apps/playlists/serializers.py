"""Serializers for playlists and their ordered tracks."""

from rest_framework import serializers

from apps.catalog.models import Song
from apps.catalog.serializers import SongSerializer

from .models import Playlist, PlaylistTrack


class PlaylistTrackSerializer(serializers.ModelSerializer):
    song = SongSerializer(read_only=True)

    class Meta:
        model = PlaylistTrack
        fields = ["id", "song", "position", "added_at"]


class PlaylistSerializer(serializers.ModelSerializer):
    tracks = PlaylistTrackSerializer(many=True, read_only=True)
    track_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Playlist
        fields = [
            "id",
            "title",
            "owner",
            "cover_image",
            "track_count",
            "tracks",
            "created_at",
        ]
        read_only_fields = ["owner", "created_at"]


class AddTrackSerializer(serializers.Serializer):
    """Payload to append a song to a playlist."""

    song = serializers.PrimaryKeyRelatedField(queryset=Song.objects.all())
