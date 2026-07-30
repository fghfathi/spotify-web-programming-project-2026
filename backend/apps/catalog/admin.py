"""Admin registration for catalog models."""

from django.contrib import admin

from .models import Album, Song


@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ["title", "artist", "release_date", "created_at"]
    search_fields = ["title", "artist__full_name", "artist__email"]
    list_filter = ["release_date"]


@admin.register(Song)
class SongAdmin(admin.ModelAdmin):
    list_display = ["title", "artist", "album", "release_date", "is_early_access"]
    search_fields = ["title", "artist__full_name", "genre"]
    list_filter = ["is_early_access", "genre", "release_date"]
    filter_horizontal = ["collaborators"]
