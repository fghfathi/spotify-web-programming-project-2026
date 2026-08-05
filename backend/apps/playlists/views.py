"""Playlist API views: list/create the current user's playlists, retrieve/
update/delete one, and add/remove tracks."""

from django.db.models import Max
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Song

from .models import Playlist, PlaylistItem
from .serializers import PlaylistSerializer, PlaylistWriteSerializer


class MyPlaylistsView(generics.ListCreateAPIView):
    """GET/POST /api/playlists/ — the current user's playlists."""

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return (
            PlaylistWriteSerializer
            if self.request.method == "POST"
            else PlaylistSerializer
        )

    def get_queryset(self):
        return (
            Playlist.objects.filter(owner=self.request.user)
            .prefetch_related("items__song__artist", "items__song__album")
        )

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class PlaylistDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/playlists/<id>/ — a single playlist.

    Reads are allowed for public playlists or the owner; writes are
    owner-only.
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return (
            PlaylistWriteSerializer
            if self.request.method in ("PUT", "PATCH")
            else PlaylistSerializer
        )

    def get_object(self):
        playlist = get_object_or_404(
            Playlist.objects.prefetch_related("items__song"), pk=self.kwargs["pk"]
        )
        if self.request.method not in ("GET", "HEAD", "OPTIONS"):
            if playlist.owner_id != self.request.user.id:
                self.permission_denied(
                    self.request, message="You do not own this playlist."
                )
        elif not playlist.is_public and playlist.owner_id != self.request.user.id:
            self.permission_denied(
                self.request, message="This playlist is private."
            )
        return playlist


class PlaylistTracksView(APIView):
    """POST /api/playlists/<id>/tracks/ — add a song by {songId}."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        playlist = get_object_or_404(Playlist, pk=pk, owner=request.user)
        song_id = request.data.get("songId") or request.data.get("song_id")
        if not song_id:
            return Response(
                {"detail": "songId is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        song = get_object_or_404(Song, pk=song_id)
        next_pos = (
            playlist.items.aggregate(m=Max("position"))["m"] or 0
        ) + 1
        PlaylistItem.objects.get_or_create(
            playlist=playlist, song=song, defaults={"position": next_pos}
        )
        return Response(
            PlaylistSerializer(playlist, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class PlaylistTrackDetailView(APIView):
    """DELETE /api/playlists/<id>/tracks/<songId>/ — remove a song."""

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, song_id):
        playlist = get_object_or_404(Playlist, pk=pk, owner=request.user)
        PlaylistItem.objects.filter(playlist=playlist, song_id=song_id).delete()
        return Response(
            PlaylistSerializer(playlist, context={"request": request}).data
        )
