"""Admin registration for playlist models."""

from django.contrib import admin

from .models import Playlist, PlaylistTrack


class PlaylistTrackInline(admin.TabularInline):
    model = PlaylistTrack
    extra = 0


@admin.register(Playlist)
class PlaylistAdmin(admin.ModelAdmin):
    list_display = ["title", "owner", "created_at"]
    search_fields = ["title", "owner__email"]
    inlines = [PlaylistTrackInline]
