from django.contrib import admin

from .models import PaymentTransaction, SubscriptionPlan, UserSubscription


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ("title", "tier", "price", "duration_days", "is_active")
    list_filter = ("tier", "is_active")


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "plan", "start_date", "end_date", "is_active")
    list_filter = ("is_active", "plan")


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "invoice_id",
        "user",
        "plan",
        "amount",
        "status",
        "gateway",
        "created_at",
    )
    list_filter = ("status", "gateway")
    search_fields = ("invoice_id", "gateway_transaction_id", "tracking_number")
