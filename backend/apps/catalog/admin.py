from django.contrib import admin

from .models import Album, Song


@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ("title", "artist", "release_date")
    search_fields = ("title", "artist__full_name")


@admin.register(Song)
class SongAdmin(admin.ModelAdmin):
    list_display = ("title", "artist", "album", "release_date", "is_early_access")
    list_filter = ("is_early_access", "genre")
    search_fields = ("title", "artist__full_name")
