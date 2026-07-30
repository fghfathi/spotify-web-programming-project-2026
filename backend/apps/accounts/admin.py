"""Admin registration for account models."""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import ArtistProfile, Follow, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ["-date_joined"]
    list_display = ["email", "username", "role", "status", "is_staff"]
    list_filter = ["role", "status", "is_staff", "is_superuser"]
    search_fields = ["email", "username", "full_name"]

    fieldsets = (
        (None, {"fields": ("email", "username", "password")}),
        ("Profile", {"fields": ("full_name", "birthdate", "gender", "bio", "profile_image")}),
        ("Platform", {"fields": ("role", "status")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "full_name", "role", "password1", "password2"),
            },
        ),
    )


@admin.register(ArtistProfile)
class ArtistProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "verification_status", "created_at"]
    list_filter = ["verification_status"]
    search_fields = ["user__email", "user__full_name"]


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ["follower", "following", "created_at"]
    search_fields = ["follower__email", "following__email"]
