"""Playlist viewset. Each user sees and manages only their own playlists.

Subscription features are enforced here: the playlist-count limit on create
and cover-image gating on create/update.
"""

from django.db.models import Max
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.subscriptions.services import check_playlist_quota, require_feature

from .models import Playlist, PlaylistTrack
from .serializers import AddTrackSerializer, PlaylistSerializer


class PlaylistViewSet(viewsets.ModelViewSet):
    """CRUD for the authenticated user's playlists."""

    serializer_class = PlaylistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Playlist.objects.filter(owner=self.request.user)
            .prefetch_related("tracks__song")
        )

    def perform_create(self, serializer):
        # Enforce the per-tier playlist-count limit and cover-image feature.
        check_playlist_quota(self.request.user)
        if serializer.validated_data.get("cover_image"):
            require_feature(
                self.request.user,
                "can_add_cover",
                "Adding a playlist cover requires a Silver or Gold subscription.",
            )
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        if serializer.validated_data.get("cover_image"):
            require_feature(
                self.request.user,
                "can_add_cover",
                "Adding a playlist cover requires a Silver or Gold subscription.",
            )
        serializer.save()

    @action(detail=True, methods=["post"], url_path="tracks")
    def add_track(self, request, pk=None):
        """POST /api/playlists/{id}/tracks — append a song."""
        playlist = self.get_object()
        serializer = AddTrackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        song = serializer.validated_data["song"]

        next_position = (
            playlist.tracks.aggregate(m=Max("position"))["m"] or 0
        ) + 1
        _, created = PlaylistTrack.objects.get_or_create(
            playlist=playlist,
            song=song,
            defaults={"position": next_position},
        )
        if not created:
            return Response(
                {"detail": "Song already in playlist."},
                status=status.HTTP_409_CONFLICT,
            )
        # Re-fetch so the response reflects the just-added track (the instance
        # from get_object() carries a stale prefetch cache).
        fresh = self.get_queryset().get(pk=playlist.pk)
        return Response(
            PlaylistSerializer(fresh, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["delete"],
        url_path=r"tracks/(?P<song_id>[^/.]+)",
    )
    def remove_track(self, request, pk=None, song_id=None):
        """DELETE /api/playlists/{id}/tracks/{song_id} — remove a song."""
        playlist = self.get_object()
        track = get_object_or_404(PlaylistTrack, playlist=playlist, song_id=song_id)
        track.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
