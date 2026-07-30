"""Serializers for catalog resources (Album, Song)."""

from rest_framework import serializers

from apps.accounts.models import User, UserRole

from .models import Album, Song


class CollaboratorSerializer(serializers.ModelSerializer):
    """Minimal artist reference used inside song payloads."""

    name = serializers.CharField(source="full_name")

    class Meta:
        model = User
        fields = ["id", "name"]


class SongSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source="artist.full_name", read_only=True)
    album_title = serializers.CharField(source="album.title", read_only=True)
    release_type = serializers.CharField(read_only=True)
    plays_count = serializers.IntegerField(read_only=True)
    collaborators = CollaboratorSerializer(many=True, read_only=True)
    # Accept collaborator ids on write without exposing a nested writable list.
    collaborator_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        required=False,
        queryset=User.objects.filter(role=UserRole.ARTIST),
        source="collaborators",
    )

    class Meta:
        model = Song
        fields = [
            "id",
            "title",
            "artist",
            "artist_name",
            "album",
            "album_title",
            "release_type",
            "collaborators",
            "collaborator_ids",
            "audio_file",
            "cover_image",
            "duration_seconds",
            "genre",
            "lyrics",
            "release_date",
            "is_early_access",
            "early_access_unlock_date",
            "plays_count",
            "created_at",
        ]
        # The owning artist is taken from the request, never the client body.
        read_only_fields = ["artist", "created_at"]

    def validate_album(self, album):
        """A song can only belong to an album owned by the same artist."""
        request = self.context.get("request")
        if album and request and album.artist_id != request.user.id:
            raise serializers.ValidationError("Album does not belong to you.")
        return album


class AlbumSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source="artist.full_name", read_only=True)
    songs = SongSerializer(many=True, read_only=True)

    class Meta:
        model = Album
        fields = [
            "id",
            "title",
            "artist",
            "artist_name",
            "cover_image",
            "release_date",
            "songs",
            "created_at",
        ]
        read_only_fields = ["artist", "created_at"]
