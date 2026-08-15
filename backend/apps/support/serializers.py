"""Support portal serializers, emitting the shapes in types/support.ts."""

from rest_framework import serializers

from apps.accounts.models import User

from .models import ArtistPayout, SupportTicket, TicketReply


class ManagedUserSerializer(serializers.ModelSerializer):
    displayName = serializers.SerializerMethodField()
    joinedDate = serializers.DateTimeField(source="date_joined", format="%Y-%m-%d")

    class Meta:
        model = User
        fields = ["id", "displayName", "email", "role", "joinedDate", "status"]

    def get_displayName(self, obj):
        return obj.full_name or obj.username


class ManagedArtistSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    joinedDate = serializers.DateTimeField(source="date_joined", format="%Y-%m-%d")
    totalReleases = serializers.SerializerMethodField()
    verificationStatus = serializers.SerializerMethodField()
    portfolioSummary = serializers.SerializerMethodField()
    rejectionReason = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "joinedDate",
            "totalReleases",
            "verificationStatus",
            "status",
            "portfolioSummary",
            "rejectionReason",
        ]

    def get_name(self, obj):
        return obj.full_name or obj.username

    def get_totalReleases(self, obj):
        return obj.albums.count() + obj.songs.filter(album__isnull=True).count()

    def _profile(self, obj):
        return getattr(obj, "artist_profile", None)

    def get_verificationStatus(self, obj):
        profile = self._profile(obj)
        return profile.verification_status if profile else "pending"

    def get_portfolioSummary(self, obj):
        profile = self._profile(obj)
        return profile.portfolio_summary if profile else ""

    def get_rejectionReason(self, obj):
        profile = self._profile(obj)
        return profile.rejection_reason if profile and profile.rejection_reason else None


class TicketReplySerializer(serializers.ModelSerializer):
    authorName = serializers.SerializerMethodField()
    authorRole = serializers.SerializerMethodField()
    sentDate = serializers.DateTimeField(source="sent_at", format="%Y-%m-%d")

    class Meta:
        model = TicketReply
        fields = ["id", "authorName", "authorRole", "message", "sentDate"]

    def get_authorName(self, obj):
        return obj.author.full_name or obj.author.username

    def get_authorRole(self, obj):
        return "staff" if obj.author.role in ("support", "admin") else "user"


class SupportTicketSerializer(serializers.ModelSerializer):
    submittedByName = serializers.SerializerMethodField()
    submittedByRole = serializers.SerializerMethodField()
    createdDate = serializers.DateTimeField(source="created_at", format="%Y-%m-%d")
    replies = TicketReplySerializer(many=True, read_only=True)

    class Meta:
        model = SupportTicket
        fields = [
            "id",
            "subject",
            "description",
            "submittedByName",
            "submittedByRole",
            "status",
            "createdDate",
            "replies",
        ]

    def get_submittedByName(self, obj):
        return obj.submitted_by.full_name or obj.submitted_by.username

    def get_submittedByRole(self, obj):
        return "artist" if obj.submitted_by.role == "artist" else "listener"


class TicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = ["id", "subject", "description"]
        read_only_fields = ["id"]

    def to_representation(self, instance):
        return SupportTicketSerializer(instance, context=self.context).data


class ArtistPayoutSerializer(serializers.ModelSerializer):
    artistId = serializers.CharField(source="artist_id", read_only=True)
    artistName = serializers.SerializerMethodField()
    uniqueListeners = serializers.IntegerField(source="unique_listeners")
    totalStreams = serializers.IntegerField(source="total_streams")
    rewardAmount = serializers.SerializerMethodField()
    payoutStatus = serializers.CharField(source="status", read_only=True)

    class Meta:
        model = ArtistPayout
        fields = [
            "id",
            "artistId",
            "artistName",
            "period",
            "uniqueListeners",
            "totalStreams",
            "rewardAmount",
            "payoutStatus",
        ]

    def get_artistName(self, obj):
        return obj.artist.full_name or obj.artist.username

    def get_rewardAmount(self, obj):
        return float(obj.reward_amount)
