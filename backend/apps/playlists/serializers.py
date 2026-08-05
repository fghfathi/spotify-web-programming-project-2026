"""Playlist serializers emitting the frontend Playlist shape (types/home.ts,
types/music.ts): id, title, coverUrl/coverImageUrl, trackCount, songs[]."""

from rest_framework import serializers

from apps.catalog.serializers import SongSerializer, abs_url

from .models import Playlist


class PlaylistSerializer(serializers.ModelSerializer):
    coverUrl = serializers.SerializerMethodField()
    coverImageUrl = serializers.SerializerMethodField()
    trackCount = serializers.IntegerField(source="track_count", read_only=True)
    songs = serializers.SerializerMethodField()

    class Meta:
        model = Playlist
        fields = [
            "id",
            "title",
            "coverUrl",
            "coverImageUrl",
            "trackCount",
            "is_public",
            "songs",
        ]

    def get_coverUrl(self, obj):
        return abs_url(self.context.get("request"), obj.cover_image)

    def get_coverImageUrl(self, obj):
        return abs_url(self.context.get("request"), obj.cover_image)

    def get_songs(self, obj):
        songs = [item.song for item in obj.items.all()]
        return SongSerializer(songs, many=True, context=self.context).data


class PlaylistWriteSerializer(serializers.ModelSerializer):
    cover_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Playlist
        fields = ["id", "title", "cover_image", "is_public"]
        read_only_fields = ["id"]

    def to_representation(self, instance):
        return PlaylistSerializer(instance, context=self.context).data
