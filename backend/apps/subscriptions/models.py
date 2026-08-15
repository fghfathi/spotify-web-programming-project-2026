"""Subscription & payment models (Step 6).

- SubscriptionPlan: a purchasable plan (Silver/Gold) with a price and duration.
- UserSubscription: a user's active entitlement, with a computed expiry.
- PaymentTransaction: one checkout attempt against the payment gateway, with
  its full lifecycle (pending -> success/failed) and the raw gateway payloads.
"""

from django.conf import settings
from django.db import models
from django.utils import timezone


class SubscriptionPlan(models.Model):
    class Tier(models.TextChoices):
        SILVER = "silver", "Silver"
        GOLD = "gold", "Gold"

    title = models.CharField(max_length=100)
    tier = models.CharField(max_length=10, choices=Tier.choices)
    duration_days = models.PositiveIntegerField(default=30)
    price = models.DecimalField(max_digits=12, decimal_places=0)
    is_active = models.BooleanField(default=True)
    # A plain list of human-readable feature strings shown on the pricing card.
    features = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["price"]

    def __str__(self):
        return f"{self.title} ({self.tier})"


class UserSubscription(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscriptions",
    )
    plan = models.ForeignKey(
        SubscriptionPlan, on_delete=models.PROTECT, related_name="subscriptions"
    )
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-end_date"]

    def __str__(self):
        return f"{self.user_id}: {self.plan.tier} until {self.end_date:%Y-%m-%d}"

    @property
    def is_currently_active(self) -> bool:
        return self.is_active and self.end_date >= timezone.now()


class PaymentTransaction(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.SET_NULL,
        null=True,
        related_name="transactions",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=0)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )
    gateway = models.CharField(max_length=40, default="aqayepardakht")
    # The gateway's transaction id ("transid" for Aqaye Pardakht).
    gateway_transaction_id = models.CharField(max_length=120, blank=True)
    # Our own unique invoice reference (also used as the frontend result key).
    invoice_id = models.CharField(max_length=64, unique=True)
    # The gateway's settlement reference / tracking number, set on success.
    tracking_number = models.CharField(max_length=120, blank=True, null=True)
    raw_gateway_response = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.invoice_id} [{self.status}]"
