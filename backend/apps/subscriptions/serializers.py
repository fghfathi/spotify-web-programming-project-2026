"""Serializers for subscription plans, purchases, and status."""

from rest_framework import serializers

from .models import BillingMonths, Payment, SubscriptionPlan, SubscriptionTier


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Public plan info; admin may PATCH price/feature fields (tier is fixed)."""

    class Meta:
        model = SubscriptionPlan
        fields = [
            "tier",
            "name",
            "price_per_month",
            "daily_stream_limit",
            "playlist_limit",
            "can_add_cover",
            "can_download",
            "early_access",
            "can_view_stats",
            "updated_at",
        ]
        read_only_fields = ["tier", "updated_at"]


class PurchaseSerializer(serializers.Serializer):
    """Buy/renew payload. Basic is free and cannot be purchased."""

    tier = serializers.ChoiceField(
        choices=[SubscriptionTier.SILVER, SubscriptionTier.GOLD]
    )
    months = serializers.ChoiceField(choices=BillingMonths.choices)


class PaymentSerializer(serializers.ModelSerializer):
    tier = serializers.CharField(source="plan.tier", read_only=True)

    class Meta:
        model = Payment
        fields = ["id", "tier", "months", "amount", "status", "created_at"]
        read_only_fields = fields


class SubscriptionStatusSerializer(serializers.Serializer):
    """The current effective subscription status for a user."""

    tier = serializers.CharField()
    plan_name = serializers.CharField()
    is_active = serializers.BooleanField()
    start_date = serializers.DateTimeField(allow_null=True)
    end_date = serializers.DateTimeField(allow_null=True)
    days_remaining = serializers.IntegerField()
    features = SubscriptionPlanSerializer()
