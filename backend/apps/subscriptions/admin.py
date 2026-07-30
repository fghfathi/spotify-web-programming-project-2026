"""Admin registration for subscription models.

The plan list is where an admin edits Silver/Gold pricing (no code change).
"""

from django.contrib import admin

from .models import Payment, Subscription, SubscriptionPlan


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = [
        "tier",
        "name",
        "price_per_month",
        "daily_stream_limit",
        "playlist_limit",
        "can_add_cover",
        "can_download",
        "early_access",
        "can_view_stats",
    ]
    list_editable = ["price_per_month"]


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ["user", "plan", "start_date", "end_date", "is_active"]
    list_filter = ["plan__tier"]
    search_fields = ["user__email"]

    @admin.display(boolean=True, description="Active")
    def is_active(self, obj):
        return obj.is_active


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["user", "plan", "months", "amount", "status", "created_at"]
    list_filter = ["status", "plan__tier"]
    search_fields = ["user__email"]
