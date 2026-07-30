"""Catalog routes."""

from rest_framework.routers import DefaultRouter

from .views import AlbumViewSet, SongViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r"albums", AlbumViewSet, basename="album")
router.register(r"songs", SongViewSet, basename="song")

urlpatterns = router.urls
