"""Catalog serializers. Read serializers emit the merged Song/Album shape the
frontend expects (types/music.ts + types/home.ts): both `coverUrl` and
`coverImageUrl` are provided so every existing component keeps working."""

from rest_framework import serializers

from apps.accounts.models import User, UserRole
from apps.common.validators import validate_audio_file, validate_image_file

from .models import Album, Song


def abs_url(request, file_field):
    if not file_field:
        return None
    url = file_field.url
    return request.build_absolute_uri(url) if request is not None else url


class SongSerializer(serializers.ModelSerializer):
    """Read representation of a track."""

    artistId = serializers.SerializerMethodField()
    artistName = serializers.SerializerMethodField()
    albumId = serializers.SerializerMethodField()
    albumName = serializers.SerializerMethodField()
    playsCount = serializers.IntegerField(source="plays_count", read_only=True)
    releaseDate = serializers.DateField(source="release_date")
    coverUrl = serializers.SerializerMethodField()
    coverImageUrl = serializers.SerializerMethodField()
    audioUrl = serializers.SerializerMethodField()
    duration = serializers.CharField(source="duration_display", read_only=True)
    releaseType = serializers.CharField(source="release_type", read_only=True)

    class Meta:
        model = Song
        fields = [
            "id",
            "title",
            "artistId",
            "artistName",
            "albumId",
            "albumName",
            "playsCount",
            "releaseDate",
            "coverUrl",
            "coverImageUrl",
            "audioUrl",
            "duration",
            "genre",
            "lyrics",
            "releaseType",
            "is_early_access",
        ]

    def get_artistId(self, obj):
        return str(obj.artist_id)

    def get_artistName(self, obj):
        return obj.artist.full_name or obj.artist.username

    def get_albumId(self, obj):
        return str(obj.album_id) if obj.album_id else None

    def get_albumName(self, obj):
        return obj.album.title if obj.album_id else None

    def _cover(self, obj):
        request = self.context.get("request")
        if obj.cover_image:
            return abs_url(request, obj.cover_image)
        if obj.album_id and obj.album.cover_image:
            return abs_url(request, obj.album.cover_image)
        return None

    def get_coverUrl(self, obj):
        return self._cover(obj)

    def get_coverImageUrl(self, obj):
        return self._cover(obj)

    def get_audioUrl(self, obj):
        return abs_url(self.context.get("request"), obj.audio_file)


class SongWriteSerializer(serializers.ModelSerializer):
    """Create/update a track from a multipart/form-data upload (Step 4)."""

    audio_file = serializers.FileField(validators=[validate_audio_file])
    cover_image = serializers.ImageField(
        required=False, allow_null=True, validators=[validate_image_file]
    )
    collaborators = serializers.PrimaryKeyRelatedField(
        many=True,
        required=False,
        queryset=User.objects.filter(role=UserRole.ARTIST),
    )

    class Meta:
        model = Song
        fields = [
            "id",
            "title",
            "album",
            "collaborators",
            "audio_file",
            "cover_image",
            "duration_seconds",
            "genre",
            "lyrics",
            "release_date",
            "is_early_access",
            "early_access_unlock_date",
        ]
        read_only_fields = ["id"]

    def validate_album(self, album):
        # An artist may only attach a track to one of their own albums.
        request = self.context.get("request")
        if album is not None and request and album.artist_id != request.user.id:
            raise serializers.ValidationError(
                "You can only add tracks to your own albums."
            )
        return album

    def to_representation(self, instance):
        return SongSerializer(instance, context=self.context).data


class AlbumSerializer(serializers.ModelSerializer):
    """Read representation of an album with its tracks."""

    artistId = serializers.SerializerMethodField()
    artistName = serializers.SerializerMethodField()
    releaseDate = serializers.DateField(source="release_date")
    coverUrl = serializers.SerializerMethodField()
    coverImageUrl = serializers.SerializerMethodField()
    songs = SongSerializer(many=True, read_only=True)
    trackCount = serializers.SerializerMethodField()

    class Meta:
        model = Album
        fields = [
            "id",
            "title",
            "artistId",
            "artistName",
            "releaseDate",
            "coverUrl",
            "coverImageUrl",
            "trackCount",
            "songs",
        ]

    def get_artistId(self, obj):
        return str(obj.artist_id)

    def get_artistName(self, obj):
        return obj.artist.full_name or obj.artist.username

    def get_coverUrl(self, obj):
        return abs_url(self.context.get("request"), obj.cover_image)

    def get_coverImageUrl(self, obj):
        return abs_url(self.context.get("request"), obj.cover_image)

    def get_trackCount(self, obj):
        return obj.songs.count()


class AlbumWriteSerializer(serializers.ModelSerializer):
    cover_image = serializers.ImageField(
        required=False, allow_null=True, validators=[validate_image_file]
    )

    class Meta:
        model = Album
        fields = ["id", "title", "cover_image", "release_date"]
        read_only_fields = ["id"]

    def to_representation(self, instance):
        return AlbumSerializer(instance, context=self.context).data


class ArtistReleaseSerializer(serializers.Serializer):
    """Release row (album or single) used in artist detail responses."""

    id = serializers.CharField()
    title = serializers.CharField()
    type = serializers.CharField()
    coverImageUrl = serializers.CharField(allow_null=True)
    releaseDate = serializers.CharField()
