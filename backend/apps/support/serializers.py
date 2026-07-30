"""Serializers for the support/admin management portal."""

from rest_framework import serializers

from apps.accounts.models import ArtistProfile, User, UserRole

from .models import AuditLog


class ManagedUserSerializer(serializers.ModelSerializer):
    """A user row in the support user-management table."""

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "role",
            "status",
            "date_joined",
        ]
        read_only_fields = fields


class ArtistVerificationSerializer(serializers.ModelSerializer):
    """An artist application row in the verification queue."""

    user_id = serializers.IntegerField(source="user.id", read_only=True)
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    total_releases = serializers.SerializerMethodField()

    class Meta:
        model = ArtistProfile
        fields = [
            "id",
            "user_id",
            "full_name",
            "email",
            "verification_status",
            "portfolio_summary",
            "rejection_reason",
            "total_releases",
            "created_at",
        ]
        read_only_fields = fields

    def get_total_releases(self, obj) -> int:
        # Releases = albums + standalone singles.
        albums = obj.user.albums.count()
        singles = obj.user.songs.filter(album__isnull=True).count()
        return albums + singles


class RejectSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=255)


class SetRoleSerializer(serializers.Serializer):
    # Admin manages support staff; artists are created via the application flow.
    role = serializers.ChoiceField(choices=[UserRole.LISTENER, UserRole.SUPPORT])


class AuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source="actor.email", read_only=True)

    class Meta:
        model = AuditLog
        fields = ["id", "actor_email", "action", "target", "note", "created_at"]
        read_only_fields = fields
