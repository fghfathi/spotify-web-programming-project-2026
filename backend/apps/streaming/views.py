"""Streaming views: record a play event when a track starts.

The actual audio bytes are served directly from MEDIA_URL (the song's
`audioUrl`); this endpoint only logs the play for analytics and gates
early-access tracks behind a Gold subscription.
"""

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Song

from .models import StreamEvent


class RecordStreamView(APIView):
    """POST /api/songs/<id>/play/ — log a play and return the stream URL."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        song = get_object_or_404(Song.objects.select_related("artist"), pk=pk)

        # Early-access tracks are Gold-only until their unlock date passes.
        if song.is_early_access:
            unlocked = (
                song.early_access_unlock_date is not None
                and song.early_access_unlock_date <= timezone.now()
            )
            if not unlocked and request.user.subscription_tier != "gold":
                return Response(
                    {"detail": "Early access is available to Gold members only."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        StreamEvent.objects.create(
            user=request.user, song=song, artist=song.artist
        )
        audio_url = (
            request.build_absolute_uri(song.audio_file.url)
            if song.audio_file
            else None
        )
        return Response(
            {"audioUrl": audio_url, "playsCount": song.plays_count},
            status=status.HTTP_201_CREATED,
        )
