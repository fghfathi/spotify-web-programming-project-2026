"""Serializers for accounts: registration, current user, public profiles,
and artist detail. Output keys are camelCase to match the frontend's existing
domain types (types/home.ts, types/profile.ts, types/artist.ts)."""

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.common.validators import validate_image_file

from .models import ArtistProfile, Follow, UserRole

User = get_user_model()


def _abs_url(request, file_field):
    """Return an absolute media URL for a file field, or None."""
    if not file_field:
        return None
    url = file_field.url
    if request is not None:
        return request.build_absolute_uri(url)
    return url


class RegisterSerializer(serializers.Serializer):
    """Create a new listener or artist account."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    fullName = serializers.CharField(
        source="full_name", required=False, allow_blank=True, default=""
    )
    # Self-registration is limited to listener/artist; staff roles are seeded.
    role = serializers.ChoiceField(
        choices=[UserRole.LISTENER, UserRole.ARTIST],
        default=UserRole.LISTENER,
    )

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )
        return value.lower()

    @transaction.atomic
    def create(self, validated_data):
        role = validated_data.get("role", UserRole.LISTENER)
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            full_name=validated_data.get("full_name", ""),
            role=role,
        )
        # New artists get a pending verification profile immediately.
        if role == UserRole.ARTIST:
            ArtistProfile.objects.get_or_create(user=user)
        return user


class LoginSerializer(TokenObtainPairSerializer):
    """Email/password login that also blocks banned accounts and returns the
    authenticated user payload alongside the tokens."""

    username_field = User.USERNAME_FIELD  # 'email'

    def validate(self, attrs):
        data = super().validate(attrs)
        if self.user.status == "banned":
            raise serializers.ValidationError(
                "This account has been suspended."
            )
        data["user"] = CurrentUserSerializer(
            self.user, context=self.context
        ).data
        return data


class CurrentUserSerializer(serializers.ModelSerializer):
    """Rich representation of the logged-in user (used by /api/me/).

    Combines the fields the sidebar/top bar need (displayName, role,
    subscription, profileImageUrl) with the profile-page personalInfo block.
    """

    displayName = serializers.SerializerMethodField()
    personalInfo = serializers.SerializerMethodField()
    profileImageUrl = serializers.SerializerMethodField()
    subscription = serializers.CharField(source="subscription_tier", read_only=True)
    followerCount = serializers.IntegerField(source="follower_count", read_only=True)
    followingCount = serializers.IntegerField(source="following_count", read_only=True)
    dailyStreams = serializers.SerializerMethodField()
    isVerified = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "role",
            "status",
            "displayName",
            "personalInfo",
            "profileImageUrl",
            "subscription",
            "followerCount",
            "followingCount",
            "dailyStreams",
            "isVerified",
        ]

    def get_displayName(self, obj):
        return obj.full_name or obj.username

    def get_personalInfo(self, obj):
        return {
            "fullName": obj.full_name,
            "email": obj.email,
            "birthdate": obj.birthdate.isoformat() if obj.birthdate else "",
            "gender": obj.gender,
            "bio": obj.bio,
        }

    def get_profileImageUrl(self, obj):
        return _abs_url(self.context.get("request"), obj.avatar)

    def get_dailyStreams(self, obj):
        # Number of stream events this user created today (streaming app).
        try:
            from django.utils import timezone

            today = timezone.now().date()
            return obj.stream_events.filter(created_at__date=today).count()
        except Exception:
            return 0

    def get_isVerified(self, obj):
        profile = getattr(obj, "artist_profile", None)
        return bool(profile and profile.is_verified)


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Update the current user's editable personal info and avatar."""

    fullName = serializers.CharField(
        source="full_name", required=False, allow_blank=True
    )
    avatar = serializers.ImageField(
        required=False, allow_null=True, validators=[validate_image_file]
    )

    class Meta:
        model = User
        fields = ["fullName", "birthdate", "gender", "bio", "avatar"]


class PublicUserSerializer(serializers.ModelSerializer):
    """Compact public representation (home current user / lists)."""

    displayName = serializers.SerializerMethodField()
    profileImageUrl = serializers.SerializerMethodField()
    subscription = serializers.CharField(source="subscription_tier", read_only=True)

    class Meta:
        model = User
        fields = ["id", "displayName", "profileImageUrl", "subscription", "role"]

    def get_displayName(self, obj):
        return obj.full_name or obj.username

    def get_profileImageUrl(self, obj):
        return _abs_url(self.context.get("request"), obj.avatar)


class ArtistSerializer(serializers.ModelSerializer):
    """Artist detail (types/artist.ts): profile + combined releases."""

    name = serializers.SerializerMethodField()
    profileImageUrl = serializers.SerializerMethodField()
    isVerified = serializers.SerializerMethodField()
    totalListeners = serializers.SerializerMethodField()
    totalStreams = serializers.SerializerMethodField()
    followersCount = serializers.IntegerField(
        source="follower_count", read_only=True
    )
    releases = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "bio",
            "profileImageUrl",
            "isVerified",
            "totalListeners",
            "totalStreams",
            "followersCount",
            "releases",
        ]

    def get_name(self, obj):
        return obj.full_name or obj.username

    def get_profileImageUrl(self, obj):
        profile = getattr(obj, "artist_profile", None)
        request = self.context.get("request")
        if profile and profile.profile_image:
            return _abs_url(request, profile.profile_image)
        return _abs_url(request, obj.avatar)

    def get_isVerified(self, obj):
        profile = getattr(obj, "artist_profile", None)
        return bool(profile and profile.is_verified)

    def get_totalListeners(self, obj):
        try:
            return (
                obj.stream_events_received.values("user").distinct().count()
                if hasattr(obj, "stream_events_received")
                else 0
            )
        except Exception:
            return 0

    def get_totalStreams(self, obj):
        try:
            return (
                obj.stream_events_received.count()
                if hasattr(obj, "stream_events_received")
                else 0
            )
        except Exception:
            return 0

    def get_releases(self, obj):
        # Releases are built inline as plain dicts (albums + singles) to avoid
        # an accounts <-> catalog import cycle.
        request = self.context.get("request")
        releases = []
        for album in obj.albums.all():
            releases.append(
                {
                    "id": f"album-{album.id}",
                    "title": album.title,
                    "type": "album",
                    "coverImageUrl": _abs_url(request, album.cover_image),
                    "releaseDate": album.release_date.isoformat(),
                }
            )
        for song in obj.songs.filter(album__isnull=True):
            releases.append(
                {
                    "id": f"single-{song.id}",
                    "title": song.title,
                    "type": "single",
                    "coverImageUrl": _abs_url(request, song.cover_image),
                    "releaseDate": song.release_date.isoformat(),
                }
            )
        releases.sort(key=lambda r: r["releaseDate"], reverse=True)
        return releases


class ArtistReleaseSerializer(serializers.Serializer):
    """Plain release row used inside ArtistSerializer.releases."""

    id = serializers.CharField()
    title = serializers.CharField()
    type = serializers.CharField()
    coverImageUrl = serializers.CharField(allow_null=True)
    releaseDate = serializers.CharField()


class FollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Follow
        fields = ["id", "follower", "following", "created_at"]
        read_only_fields = ["id", "created_at"]
