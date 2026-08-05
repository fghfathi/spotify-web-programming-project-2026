"""Catalog API views: public browse (songs/albums), artist-owned CRUD with
media uploads, a home feed aggregator, and global search."""

from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User, UserRole
from apps.accounts.serializers import PublicUserSerializer
from apps.common.permissions import IsArtist

from .models import Album, Song
from .serializers import (
    AlbumSerializer,
    AlbumWriteSerializer,
    SongSerializer,
    SongWriteSerializer,
)


class SongListView(generics.ListAPIView):
    """GET /api/songs/ — browse all tracks, optional ?search= and ?ordering=."""

    serializer_class = SongSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Song.objects.select_related("artist", "album")
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(title__icontains=search) | Q(artist__full_name__icontains=search)
            )
        ordering = self.request.query_params.get("ordering")
        if ordering == "popular":
            # Most-played first (annotated by stream count).
            from django.db.models import Count

            qs = qs.annotate(_plays=Count("stream_events")).order_by("-_plays")
        return qs


class SongDetailView(generics.RetrieveAPIView):
    queryset = Song.objects.select_related("artist", "album")
    serializer_class = SongSerializer
    permission_classes = [IsAuthenticated]


class AlbumListView(generics.ListAPIView):
    serializer_class = AlbumSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Album.objects.select_related("artist").prefetch_related("songs")
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(title__icontains=search) | Q(artist__full_name__icontains=search)
            )
        return qs


class AlbumDetailView(generics.RetrieveAPIView):
    queryset = Album.objects.select_related("artist").prefetch_related("songs")
    serializer_class = AlbumSerializer
    permission_classes = [IsAuthenticated]


class MyTracksView(generics.ListCreateAPIView):
    """GET/POST /api/me/tracks/ — an artist's own tracks; POST uploads a new
    track via multipart/form-data (Step 4)."""

    permission_classes = [IsArtist]

    def get_serializer_class(self):
        return SongWriteSerializer if self.request.method == "POST" else SongSerializer

    def get_queryset(self):
        return Song.objects.filter(artist=self.request.user).select_related(
            "artist", "album"
        )

    def perform_create(self, serializer):
        serializer.save(artist=self.request.user)


class MyTrackDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/me/tracks/<id>/ — manage one of the artist's
    own tracks."""

    permission_classes = [IsArtist]

    def get_serializer_class(self):
        return (
            SongWriteSerializer
            if self.request.method in ("PUT", "PATCH")
            else SongSerializer
        )

    def get_queryset(self):
        return Song.objects.filter(artist=self.request.user)


class MyAlbumsView(generics.ListCreateAPIView):
    permission_classes = [IsArtist]

    def get_serializer_class(self):
        return AlbumWriteSerializer if self.request.method == "POST" else AlbumSerializer

    def get_queryset(self):
        return Album.objects.filter(artist=self.request.user).prefetch_related("songs")

    def perform_create(self, serializer):
        serializer.save(artist=self.request.user)


class MyAlbumDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsArtist]

    def get_serializer_class(self):
        return (
            AlbumWriteSerializer
            if self.request.method in ("PUT", "PATCH")
            else AlbumSerializer
        )

    def get_queryset(self):
        return Album.objects.filter(artist=self.request.user)


class EarlyAccessView(generics.ListAPIView):
    """GET /api/early-access/ — Gold-tier early-access tracks."""

    serializer_class = SongSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Song.objects.filter(is_early_access=True).select_related(
            "artist", "album"
        )


class HomeFeedView(APIView):
    """GET /api/home/ — aggregated content sections for the home page."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        ctx = {"request": request}
        recent_albums = (
            Album.objects.select_related("artist")
            .prefetch_related("songs")[:10]
        )
        popular_songs = Song.objects.select_related("artist", "album")[:12]
        early_access = Song.objects.filter(is_early_access=True).select_related(
            "artist", "album"
        )[:10]

        # Featured playlists are the public playlists (lazy import).
        from apps.playlists.models import Playlist
        from apps.playlists.serializers import PlaylistSerializer

        playlists = (
            Playlist.objects.filter(is_public=True)
            .select_related("owner")
            .prefetch_related("items__song")[:10]
        )

        return Response(
            {
                "recentPlaylists": PlaylistSerializer(
                    playlists, many=True, context=ctx
                ).data,
                "recentAlbums": AlbumSerializer(
                    recent_albums, many=True, context=ctx
                ).data,
                "popularSongs": SongSerializer(
                    popular_songs, many=True, context=ctx
                ).data,
                "earlyAccess": [
                    {
                        "id": str(s.id),
                        "title": s.title,
                        "artistId": str(s.artist_id),
                        "artistName": s.artist.full_name or s.artist.username,
                        "coverImageUrl": SongSerializer(
                            s, context=ctx
                        ).data["coverImageUrl"],
                        "unlockDate": (
                            s.early_access_unlock_date.isoformat()
                            if s.early_access_unlock_date
                            else s.release_date.isoformat()
                        ),
                    }
                    for s in early_access
                ],
            }
        )


class SearchView(APIView):
    """GET /api/search/?q= — cross-entity search (songs, albums, artists,
    playlists)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = (request.query_params.get("q") or "").strip()
        ctx = {"request": request}
        if not query:
            return Response(
                {"songs": [], "albums": [], "artists": [], "playlists": []}
            )

        songs = Song.objects.filter(
            Q(title__icontains=query) | Q(artist__full_name__icontains=query)
        ).select_related("artist", "album")[:20]
        albums = Album.objects.filter(
            Q(title__icontains=query) | Q(artist__full_name__icontains=query)
        ).select_related("artist")[:20]
        artists = User.objects.filter(
            role=UserRole.ARTIST
        ).filter(Q(full_name__icontains=query) | Q(username__icontains=query))[:20]

        from apps.playlists.models import Playlist
        from apps.playlists.serializers import PlaylistSerializer

        playlists = Playlist.objects.filter(
            is_public=True, title__icontains=query
        ).select_related("owner")[:20]

        return Response(
            {
                "songs": SongSerializer(songs, many=True, context=ctx).data,
                "albums": AlbumSerializer(albums, many=True, context=ctx).data,
                "artists": PublicUserSerializer(
                    artists, many=True, context=ctx
                ).data,
                "playlists": PlaylistSerializer(
                    playlists, many=True, context=ctx
                ).data,
            }
        )
