"""Seed the three subscription plans with the Phase 1 feature matrix.

Prices are seeded to sensible defaults; the admin can change Silver/Gold prices
at any time via the admin panel or the PATCH endpoint (no code change needed).
Feature flags are only applied when a plan row is first created, so admin price
edits are never overwritten by re-running migrations.
"""

from decimal import Decimal

from django.db import migrations

# tier -> (name, price, daily_stream_limit, playlist_limit,
#          can_add_cover, can_download, early_access, can_view_stats)
PLANS = {
    "basic": ("Basic", Decimal("0.00"), 60, 6, False, False, False, False),
    "silver": ("Silver", Decimal("5.00"), None, 100, True, True, False, False),
    "gold": ("Gold", Decimal("10.00"), None, None, True, True, True, True),
}


def seed_plans(apps, schema_editor):
    SubscriptionPlan = apps.get_model("subscriptions", "SubscriptionPlan")
    for tier, cfg in PLANS.items():
        (
            name,
            price,
            daily,
            playlists,
            cover,
            download,
            early,
            stats,
        ) = cfg
        SubscriptionPlan.objects.get_or_create(
            tier=tier,
            defaults={
                "name": name,
                "price_per_month": price,
                "daily_stream_limit": daily,
                "playlist_limit": playlists,
                "can_add_cover": cover,
                "can_download": download,
                "early_access": early,
                "can_view_stats": stats,
            },
        )


def unseed_plans(apps, schema_editor):
    SubscriptionPlan = apps.get_model("subscriptions", "SubscriptionPlan")
    SubscriptionPlan.objects.filter(tier__in=PLANS.keys()).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("subscriptions", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_plans, unseed_plans),
    ]
