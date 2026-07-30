"""Catalog viewsets: albums and songs.

Reads are public; writes are limited to the owning artist. Subscription-based
business rules (daily stream limit, early access, download, stats) are enforced
here via the subscriptions services. The role rule "only *verified* artists may
publish" is added in step 3.3.
"""

from django.http import FileResponse
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsOwnerOrReadOnly, IsVerifiedArtistOrReadOnly
from apps.streaming.models import StreamEvent
from apps.subscriptions.services import get_effective_plan, require_feature

from .models import Album, Song
from .serializers import AlbumSerializer, SongSerializer


class AlbumViewSet(viewsets.ModelViewSet):
    queryset = Album.objects.select_related("artist").prefetch_related("songs")
    serializer_class = AlbumSerializer
    # Read: public. Write: an approved artist, and only on their own albums.
    permission_classes = [IsVerifiedArtistOrReadOnly, IsOwnerOrReadOnly]
    owner_field = "artist"

    def perform_create(self, serializer):
        serializer.save(artist=self.request.user)


class SongViewSet(viewsets.ModelViewSet):
    queryset = Song.objects.select_related("artist", "album").prefetch_related(
        "collaborators"
    )
    serializer_class = SongSerializer
    # Read: public. Write: an approved artist, and only on their own songs.
    permission_classes = [IsVerifiedArtistOrReadOnly, IsOwnerOrReadOnly]
    owner_field = "artist"

    def get_queryset(self):
        qs = super().get_queryset()
        album_id = self.request.query_params.get("album")
        artist_id = self.request.query_params.get("artist")
        if album_id:
            qs = qs.filter(album_id=album_id)
        if artist_id:
            qs = qs.filter(artist_id=artist_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(artist=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def stream(self, request, pk=None):
        """POST /api/songs/{id}/stream — record a play (enforces tier limits)."""
        song = self.get_object()
        user = request.user
        plan = get_effective_plan(user)

        # Early-access gate: an unreleased early-access track is playable only
        # by plans with the early_access feature (Gold) until its unlock date.
        if (
            song.is_early_access
            and song.early_access_unlock_date
            and song.early_access_unlock_date > timezone.now()
            and not plan.early_access
        ):
            raise PermissionDenied(
                "This song is in early access. Upgrade to Gold to listen now."
            )

        # Daily stream limit (Basic: 60/day; Silver/Gold: unlimited => None).
        if plan.daily_stream_limit is not None:
            today = timezone.localdate()
            today_count = StreamEvent.objects.filter(
                user=user, created_at__date=today
            ).count()
            if today_count >= plan.daily_stream_limit:
                raise PermissionDenied(
                    f"Daily stream limit reached ({plan.daily_stream_limit}). "
                    "Upgrade to Silver or Gold for unlimited streaming."
                )

        StreamEvent.objects.create(user=user, song=song)

        remaining = None
        if plan.daily_stream_limit is not None:
            used = StreamEvent.objects.filter(
                user=user, created_at__date=timezone.localdate()
            ).count()
            remaining = max(plan.daily_stream_limit - used, 0)
        return Response(
            {"plays_count": song.stream_events.count(), "daily_remaining": remaining},
            status=201,
        )

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def download(self, request, pk=None):
        """GET /api/songs/{id}/download — download audio (Silver/Gold only)."""
        song = self.get_object()
        require_feature(
            request.user,
            "can_download",
            "Downloading requires a Silver or Gold subscription.",
        )
        if not song.audio_file:
            raise NotFound("This song has no audio file.")
        return FileResponse(
            song.audio_file.open("rb"),
            as_attachment=True,
            filename=song.audio_file.name.split("/")[-1],
        )

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def stats(self, request, pk=None):
        """GET /api/songs/{id}/stats — the song owner, or a Gold listener."""
        song = self.get_object()
        user = request.user
        if song.artist_id != user.id and not get_effective_plan(user).can_view_stats:
            raise PermissionDenied("Viewing stats requires a Gold subscription.")
        events = song.stream_events
        return Response(
            {
                "streams": events.count(),
                "unique_listeners": events.values("user").distinct().count(),
            }
        )
