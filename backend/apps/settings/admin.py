from django.contrib import admin

from .models import UserSettings


@admin.register(UserSettings)
class UserSettingsAdmin(admin.ModelAdmin):
    list_display = ("user", "theme", "language", "playback_volume", "repeat_mode")
