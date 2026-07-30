"""Subscription domain: plans (with DB-configurable pricing), a user's active
subscription, and payment records.

Tiers and their feature limits (from Phase 1):

              daily streams   playlists   cover  download  early  stats   price
    Basic         60             6          no     no       no     no     free
    Silver     unlimited        100         yes    yes      no     no     paid
    Gold       unlimited     unlimited      yes    yes      yes    yes    paid

`null` on a numeric limit means "unlimited". Prices live in the database so an
admin can change Silver/Gold pricing at any time with no code change.
"""

from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone


class SubscriptionTier(models.TextChoices):
    BASIC = "basic", "Basic"
    SILVER = "silver", "Silver"
    GOLD = "gold", "Gold"


class BillingMonths(models.IntegerChoices):
    ONE = 1, "1 month"
    THREE = 3, "3 months"
    SIX = 6, "6 months"
    TWELVE = 12, "12 months"


class SubscriptionPlan(models.Model):
    """A purchasable tier. One row per tier; feature flags + price are data."""

    tier = models.CharField(
        max_length=10, choices=SubscriptionTier.choices, unique=True
    )
    name = models.CharField(max_length=50)
    price_per_month = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )

    # Feature limits. null = unlimited for the two numeric limits.
    daily_stream_limit = models.PositiveIntegerField(null=True, blank=True)
    playlist_limit = models.PositiveIntegerField(null=True, blank=True)
    can_add_cover = models.BooleanField(default=False)
    can_download = models.BooleanField(default=False)
    early_access = models.BooleanField(default=False)
    can_view_stats = models.BooleanField(default=False)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["price_per_month"]

    def __str__(self):
        return f"{self.name} ({self.tier})"

    @property
    def is_free(self) -> bool:
        return self.price_per_month <= 0


class Subscription(models.Model):
    """A user's current paid subscription. Absence of a row (or an expired one)
    means the user is implicitly on the free Basic tier.

    One row per user: renewals extend `end_date`; switching tier resets it.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscription",
    )
    plan = models.ForeignKey(
        SubscriptionPlan, on_delete=models.PROTECT, related_name="subscriptions"
    )
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user_id}: {self.plan.tier} until {self.end_date:%Y-%m-%d}"

    @property
    def is_active(self) -> bool:
        return self.end_date >= timezone.now()

    @property
    def days_remaining(self) -> int:
        return max((self.end_date - timezone.now()).days, 0)


class Payment(models.Model):
    """An immutable record of a subscription purchase/renewal.

    `amount` is a snapshot of price at purchase time, so later admin price
    changes never rewrite history.
    """

    class Status(models.TextChoices):
        COMPLETED = "completed", "Completed"
        PENDING = "pending", "Pending"
        FAILED = "failed", "Failed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payments"
    )
    plan = models.ForeignKey(
        SubscriptionPlan, on_delete=models.PROTECT, related_name="payments"
    )
    months = models.PositiveSmallIntegerField(choices=BillingMonths.choices)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.COMPLETED
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user_id}: {self.plan.tier} x{self.months}mo = {self.amount}"
