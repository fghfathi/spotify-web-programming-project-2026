"""Serializers for accounts: registration, current-user profile, artists."""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import ArtistProfile, Follow

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """Public listener registration. Role is forced to LISTENER server-side;
    becoming an artist happens through a separate application flow."""

    password = serializers.CharField(
        write_only=True, validators=[validate_password], style={"input_type": "password"}
    )

    class Meta:
        model = User
        fields = ["id", "email", "password", "full_name"]

    def create(self, validated_data):
        # `create_user` hashes the password and assigns a unique username.
        return User.objects.create_user(**validated_data)


class ArtistProfileSerializer(serializers.ModelSerializer):
    is_verified = serializers.BooleanField(read_only=True)

    class Meta:
        model = ArtistProfile
        fields = [
            "verification_status",
            "is_verified",
            "portfolio_summary",
            "rejection_reason",
            "created_at",
        ]
        read_only_fields = ["verification_status", "rejection_reason", "created_at"]


class UserSerializer(serializers.ModelSerializer):
    """Full profile of the *current* user (`/api/me`)."""

    follower_count = serializers.IntegerField(read_only=True)
    following_count = serializers.IntegerField(read_only=True)
    artist_profile = ArtistProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "role",
            "status",
            "full_name",
            "birthdate",
            "gender",
            "bio",
            "profile_image",
            "follower_count",
            "following_count",
            "artist_profile",
            "date_joined",
        ]
        # username/email/role/status are system- or support-managed, not
        # editable through the self-service profile endpoint.
        read_only_fields = [
            "username",
            "email",
            "role",
            "status",
            "follower_count",
            "following_count",
            "artist_profile",
            "date_joined",
        ]


class PublicArtistSerializer(serializers.ModelSerializer):
    """Read-only public view of an artist (artist profile page)."""

    is_verified = serializers.SerializerMethodField()
    follower_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "full_name",
            "bio",
            "profile_image",
            "is_verified",
            "follower_count",
        ]

    def get_is_verified(self, obj) -> bool:
        profile = getattr(obj, "artist_profile", None)
        return bool(profile and profile.is_verified)


class ArtistApplicationSerializer(serializers.Serializer):
    """Payload for a listener applying to become an artist."""

    portfolio_summary = serializers.CharField(allow_blank=True, required=False)


class FollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Follow
        fields = ["id", "follower", "following", "created_at"]
        read_only_fields = fields
