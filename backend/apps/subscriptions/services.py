"""Business logic for subscriptions and feature-limit enforcement.

This module is the single source of truth for:
- resolving a user's *effective* plan (their active paid plan, else Basic),
- purchasing / renewing a subscription,
- guarding feature-gated actions (cover upload, download, stats) and
  quota-limited actions (playlist count).

Deliberately depends only on this app's models plus related-manager access,
so no other app imports leak in (avoids circular imports).
"""

import calendar

from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from .models import Payment, Subscription, SubscriptionPlan, SubscriptionTier


def add_months(dt, months: int):
    """Calendar-correct addition of whole months to a datetime."""
    month_index = dt.month - 1 + months
    year = dt.year + month_index // 12
    month = month_index % 12 + 1
    day = min(dt.day, calendar.monthrange(year, month)[1])
    return dt.replace(year=year, month=month, day=day)


def get_basic_plan() -> SubscriptionPlan:
    """The free default plan every user falls back to."""
    return SubscriptionPlan.objects.get(tier=SubscriptionTier.BASIC)


def get_effective_plan(user) -> SubscriptionPlan:
    """The plan whose limits currently apply to `user`."""
    if not user or not getattr(user, "is_authenticated", False):
        return get_basic_plan()
    sub = getattr(user, "subscription", None)
    if sub and sub.is_active:
        return sub.plan
    return get_basic_plan()


def purchase_subscription(user, tier: str, months: int):
    """Buy or renew a subscription. Returns (subscription, payment).

    - Renewal (same active tier): extend from the current end date.
    - Switch or re-subscribe (different tier / expired): start fresh from now.
    """
    plan = SubscriptionPlan.objects.get(tier=tier)
    amount = plan.price_per_month * months
    now = timezone.now()

    sub = getattr(user, "subscription", None)
    if sub and sub.is_active and sub.plan_id == plan.id:
        sub.end_date = add_months(sub.end_date, months)
        sub.save(update_fields=["end_date", "updated_at"])
    elif sub:
        sub.plan = plan
        sub.start_date = now
        sub.end_date = add_months(now, months)
        sub.save()
    else:
        sub = Subscription.objects.create(
            user=user, plan=plan, start_date=now, end_date=add_months(now, months)
        )

    payment = Payment.objects.create(
        user=user, plan=plan, months=months, amount=amount
    )
    return sub, payment


# --- Enforcement guards (raise 403 PermissionDenied when violated) ----------

def require_feature(user, flag: str, message: str) -> None:
    """Assert the user's effective plan has a boolean feature enabled."""
    if not getattr(get_effective_plan(user), flag):
        raise PermissionDenied(message)


def check_playlist_quota(user) -> None:
    """Assert the user has room for another playlist under their plan."""
    plan = get_effective_plan(user)
    if plan.playlist_limit is not None:
        # `playlists` related manager avoids importing the playlists app.
        if user.playlists.count() >= plan.playlist_limit:
            raise PermissionDenied(
                f"Playlist limit reached for your plan ({plan.playlist_limit}). "
                "Upgrade to create more."
            )
