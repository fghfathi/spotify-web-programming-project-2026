"""Subscription & payment serializers (camelCase output for the frontend)."""

from rest_framework import serializers

from .models import PaymentTransaction, SubscriptionPlan, UserSubscription


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    durationDays = serializers.IntegerField(source="duration_days", read_only=True)
    durationMonths = serializers.SerializerMethodField()
    isActive = serializers.BooleanField(source="is_active", read_only=True)
    price = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionPlan
        fields = [
            "id",
            "title",
            "tier",
            "durationDays",
            "durationMonths",
            "price",
            "features",
            "isActive",
        ]

    def get_price(self, obj):
        return int(obj.price)

    def get_durationMonths(self, obj):
        # Whole months, derived from duration_days (30 days == 1 month).
        return max(1, round(obj.duration_days / 30))


class UserSubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    startDate = serializers.DateTimeField(source="start_date", read_only=True)
    endDate = serializers.DateTimeField(source="end_date", read_only=True)
    isActive = serializers.BooleanField(source="is_currently_active", read_only=True)

    class Meta:
        model = UserSubscription
        fields = ["id", "plan", "startDate", "endDate", "isActive"]


class PaymentTransactionSerializer(serializers.ModelSerializer):
    invoiceId = serializers.CharField(source="invoice_id", read_only=True)
    trackingNumber = serializers.CharField(
        source="tracking_number", read_only=True
    )
    planTitle = serializers.SerializerMethodField()
    amount = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = PaymentTransaction
        fields = [
            "invoiceId",
            "amount",
            "status",
            "gateway",
            "trackingNumber",
            "planTitle",
            "createdAt",
        ]

    def get_planTitle(self, obj):
        return obj.plan.title if obj.plan else None

    def get_amount(self, obj):
        return int(obj.amount)
