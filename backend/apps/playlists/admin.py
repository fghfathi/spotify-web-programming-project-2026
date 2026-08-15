from django.contrib import admin

from .models import Playlist, PlaylistItem


class PlaylistItemInline(admin.TabularInline):
    model = PlaylistItem
    extra = 0


@admin.register(Playlist)
class PlaylistAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "is_public", "updated_at")
    inlines = [PlaylistItemInline]
