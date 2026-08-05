"""Catalog routes (mounted under /api/)."""

from django.urls import path

from .views import (
    AlbumDetailView,
    AlbumListView,
    EarlyAccessView,
    HomeFeedView,
    MyAlbumDetailView,
    MyAlbumsView,
    MyTrackDetailView,
    MyTracksView,
    SearchView,
    SongDetailView,
    SongListView,
)

urlpatterns = [
    path("home/", HomeFeedView.as_view(), name="home-feed"),
    path("search/", SearchView.as_view(), name="search"),
    path("songs/", SongListView.as_view(), name="song-list"),
    path("songs/<int:pk>/", SongDetailView.as_view(), name="song-detail"),
    path("albums/", AlbumListView.as_view(), name="album-list"),
    path("albums/<int:pk>/", AlbumDetailView.as_view(), name="album-detail"),
    path("early-access/", EarlyAccessView.as_view(), name="early-access"),
    path("me/tracks/", MyTracksView.as_view(), name="my-tracks"),
    path("me/tracks/<int:pk>/", MyTrackDetailView.as_view(), name="my-track-detail"),
    path("me/albums/", MyAlbumsView.as_view(), name="my-albums"),
    path("me/albums/<int:pk>/", MyAlbumDetailView.as_view(), name="my-album-detail"),
]
