from django.urls import path

from .views import (
    MyPlaylistsView,
    PlaylistDetailView,
    PlaylistTrackDetailView,
    PlaylistTracksView,
)

urlpatterns = [
    path("playlists/", MyPlaylistsView.as_view(), name="playlists"),
    path("playlists/<int:pk>/", PlaylistDetailView.as_view(), name="playlist-detail"),
    path(
        "playlists/<int:pk>/tracks/",
        PlaylistTracksView.as_view(),
        name="playlist-tracks",
    ),
    path(
        "playlists/<int:pk>/tracks/<int:song_id>/",
        PlaylistTrackDetailView.as_view(),
        name="playlist-track-detail",
    ),
]
