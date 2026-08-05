from django.contrib import admin

from .models import StreamEvent


@admin.register(StreamEvent)
class StreamEventAdmin(admin.ModelAdmin):
    list_display = ("user", "song", "artist", "created_at")
    list_filter = ("created_at",)
