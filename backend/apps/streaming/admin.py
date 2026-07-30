"""Admin registration for stream events (read-only audit view)."""

from django.contrib import admin

from .models import StreamEvent


@admin.register(StreamEvent)
class StreamEventAdmin(admin.ModelAdmin):
    list_display = ["user", "song", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["user__email", "song__title"]
    readonly_fields = ["user", "song", "created_at"]
