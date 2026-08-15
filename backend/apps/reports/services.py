"""Report aggregation services (part 3.7).

Every number rendered on a reporting page is produced here, by the database,
using aggregation/annotation. The API returns finished values; the frontend
never receives a raw list to summarize itself.

Three audiences, three builders:
- `build_admin_report()`   — platform-wide totals, revenue, subscriptions.
- `build_support_report()` — moderation and ticket workload.
- `build_artist_report()`  — one artist's own catalog performance.

Conventions:
- Response keys are camelCase, matching the rest of the API.
- Money is returned as a float plus a `currency` symbol; formatting is the
  frontend's only remaining job.
- Every `values().annotate()` below calls `order_by()` explicitly. The models
  carry a `Meta.ordering`, and without that reset Django would add the ordering
  column to the GROUP BY and silently split the aggregate into extra rows.
"""

from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.db.models import (
    Count,
    DecimalField,
    ExpressionWrapper,
    F,
    OuterRef,
    Q,
    Subquery,
    Sum,
    Value,
)
from django.db.models.functions import Coalesce, TruncMonth
from django.utils import timezone

from apps.accounts.models import AccountStatus, ArtistProfile, User, UserRole
from apps.catalog.models import Album, Song
from apps.playlists.models import Playlist
from apps.streaming.models import StreamEvent
from apps.subscriptions.models import PaymentTransaction, UserSubscription
from apps.support.models import ArtistPayout, SupportTicket

# How much an artist earns per stream. Single source of truth: the frontend
# used to hold its own copy of this constant and multiply on the client.
REVENUE_PER_STREAM = Decimal(str(getattr(settings, "ARTIST_REVENUE_PER_STREAM", "0.004")))
CURRENCY = getattr(settings, "PLATFORM_CURRENCY_SYMBOL", "$")

MONEY = DecimalField(max_digits=18, decimal_places=4)
ZERO = Value(Decimal("0"), output_field=MONEY)

# Tier display names live with the report, so the frontend renders a label it
# is handed rather than deriving one from a key.
TIER_LABELS = {
    "basic": ("Basic", "پایه"),
    "silver": ("Silver", "نقره‌ای"),
    "gold": ("Gold", "طلایی"),
}


# --- small helpers --------------------------------------------------------
def _f(value) -> float:
    """Coerce a Decimal/None aggregate result to a JSON-friendly float."""
    return float(value or 0)


def _pct_change(current: float, previous: float) -> float:
    """Month-over-month change in percent, rounded to one decimal place."""
    if not previous:
        return 0.0
    return round((current - previous) / previous * 100, 1)


def _share_pct(part: int, total: int) -> float:
    return round(part / total * 100, 1) if total else 0.0


def _month_bounds(now=None):
    """Return (now, start_of_this_month, start_of_previous_month)."""
    now = now or timezone.now()
    this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    prev_month = (this_month - timedelta(days=1)).replace(day=1)
    return now, this_month, prev_month


def _active_subscriptions(at):
    """Exactly one subscription row per user whose paid window contains `at`.

    Renewing extends a user's entitlement by inserting a new row, so a user who
    renews early has two rows whose windows both contain `at`. Aggregating over
    the raw filter would count that user twice and inflate MRR by a whole plan
    price. The correlated subquery keeps only each user's latest-expiring row.

    The window is matched on dates alone rather than the `is_active` flag: that
    flag describes the row *today*, so it cannot answer "was this live at the
    close of last month".
    """
    latest_per_user = (
        UserSubscription.objects.filter(
            user=OuterRef("user"), start_date__lte=at, end_date__gte=at
        )
        .order_by("-end_date")
        .values("pk")[:1]
    )
    return UserSubscription.objects.filter(
        start_date__lte=at, end_date__gte=at, pk=Subquery(latest_per_user)
    )


def _mrr_and_payers(at):
    """Recurring revenue and paying-subscriber count at a point in time."""
    row = _active_subscriptions(at).aggregate(
        mrr=Coalesce(Sum("plan__price", output_field=MONEY), ZERO),
        payers=Count("user", distinct=True),
    )
    return _f(row["mrr"]), row["payers"]


# --- Admin report ---------------------------------------------------------
def build_admin_report() -> dict:
    """Platform-wide report for the system administrator."""
    now, this_month, prev_month = _month_bounds()
    last_30d = now - timedelta(days=30)

    # One pass over the user table for every headcount we need.
    people = User.objects.aggregate(
        total_users=Count("id", filter=Q(role__in=[UserRole.LISTENER, UserRole.ARTIST])),
        total_listeners=Count("id", filter=Q(role=UserRole.LISTENER)),
        total_artists=Count("id", filter=Q(role=UserRole.ARTIST)),
        active_artists=Count(
            "id", filter=Q(role=UserRole.ARTIST, status=AccountStatus.ACTIVE)
        ),
        banned_users=Count("id", filter=Q(status=AccountStatus.BANNED)),
        new_users_30d=Count(
            "id",
            filter=Q(
                role__in=[UserRole.LISTENER, UserRole.ARTIST], date_joined__gte=last_30d
            ),
        ),
    )

    catalog = Song.objects.aggregate(
        total_songs=Count("id"),
        early_access_songs=Count("id", filter=Q(is_early_access=True)),
        new_songs_30d=Count("id", filter=Q(created_at__gte=last_30d)),
    )

    plays = StreamEvent.objects.aggregate(
        total_plays=Count("id"),
        unique_listeners=Count("user", distinct=True),
        plays_30d=Count("id", filter=Q(created_at__gte=last_30d)),
    )

    # Cash actually collected, split by calendar month for the growth indicator.
    money = PaymentTransaction.objects.filter(
        status=PaymentTransaction.Status.SUCCESS
    ).aggregate(
        total_revenue=Coalesce(Sum("amount", output_field=MONEY), ZERO),
        successful_payments=Count("id"),
        revenue_this_month=Coalesce(
            Sum("amount", filter=Q(created_at__gte=this_month), output_field=MONEY), ZERO
        ),
        revenue_prev_month=Coalesce(
            Sum(
                "amount",
                filter=Q(created_at__gte=prev_month, created_at__lt=this_month),
                output_field=MONEY,
            ),
            ZERO,
        ),
    )
    failed_payments = PaymentTransaction.objects.filter(
        status=PaymentTransaction.Status.FAILED
    ).count()

    tickets = _ticket_totals()

    # Recurring revenue now vs. at the close of the previous month.
    mrr, paying_users = _mrr_and_payers(now)
    prev_month_end = this_month - timedelta(seconds=1)
    prev_mrr, prev_paying_users = _mrr_and_payers(prev_month_end)

    arpu = mrr / paying_users if paying_users else 0.0
    prev_arpu = prev_mrr / prev_paying_users if prev_paying_users else 0.0

    distribution = _tier_distribution(now, people["total_users"])

    return {
        "currency": CURRENCY,
        "periodLabel": "This Month",
        "generatedAt": now.isoformat(),
        "users": {
            "totalUsers": people["total_users"],
            "totalListeners": people["total_listeners"],
            "totalArtists": people["total_artists"],
            "activeArtists": people["active_artists"],
            "bannedUsers": people["banned_users"],
            "newUsersLast30Days": people["new_users_30d"],
        },
        "content": {
            "totalSongs": catalog["total_songs"],
            "totalAlbums": Album.objects.count(),
            "totalPlaylists": Playlist.objects.count(),
            "earlyAccessSongs": catalog["early_access_songs"],
            "newSongsLast30Days": catalog["new_songs_30d"],
        },
        "plays": {
            "totalPlays": plays["total_plays"],
            "uniqueListeners": plays["unique_listeners"],
            "playsLast30Days": plays["plays_30d"],
        },
        "revenue": {
            "totalRevenue": _f(money["total_revenue"]),
            "revenueThisMonth": _f(money["revenue_this_month"]),
            "revenuePreviousMonth": _f(money["revenue_prev_month"]),
            "revenueChangePct": _pct_change(
                _f(money["revenue_this_month"]), _f(money["revenue_prev_month"])
            ),
            "monthlyRecurringRevenue": mrr,
            "successfulPayments": money["successful_payments"],
            "failedPayments": failed_payments,
            "pendingPayouts": _f(_payout_totals()["pending_amount"]),
        },
        "subscriptions": {
            "activeSubscriptions": paying_users,
            "payingUsers": paying_users,
            "freeUsers": distribution["free"],
            "distribution": distribution["counts"],
        },
        "tickets": tickets,
        "analytics": {
            "currency": CURRENCY,
            "periodLabel": "This Month",
            "distribution": distribution["slices"],
            "metrics": [
                {
                    "id": "mrr",
                    "label": "Total Monthly Revenue",
                    "labelFa": "درآمد کل این ماه",
                    "value": mrr,
                    "format": "currency",
                    "changePct": _pct_change(mrr, prev_mrr),
                    "previousValue": prev_mrr,
                },
                {
                    "id": "paying",
                    "label": "Paying Subscribers",
                    "labelFa": "مشترکین پولی",
                    "value": paying_users,
                    "format": "number",
                    "changePct": _pct_change(paying_users, prev_paying_users),
                    "previousValue": prev_paying_users,
                },
                {
                    "id": "arpu",
                    "label": "Avg. Revenue / User",
                    "labelFa": "میانگین درآمد هر کاربر",
                    "value": round(arpu, 2),
                    "format": "currency",
                    "changePct": _pct_change(arpu, prev_arpu),
                    "previousValue": round(prev_arpu, 2),
                },
            ],
        },
        "revenueTrend": _revenue_trend(now),
        "topArtists": _top_artists(),
        "topSongs": _top_songs(),
    }


def _tier_distribution(at, total_users: int) -> dict:
    """Users per subscription tier, as raw counts and as ready-to-plot slices."""
    rows = (
        _active_subscriptions(at)
        .values("plan__tier")
        .annotate(users=Count("user", distinct=True))
        .order_by()
    )
    by_tier = {row["plan__tier"]: row["users"] for row in rows}
    silver = by_tier.get("silver", 0)
    gold = by_tier.get("gold", 0)
    free = max(total_users - silver - gold, 0)

    counts = {"free": free, "silver": silver, "gold": gold}
    # "free" is presented as the "basic" tier on the pricing/analytics pages.
    slices = []
    for key, users in (("basic", free), ("silver", silver), ("gold", gold)):
        label, label_fa = TIER_LABELS[key]
        slices.append(
            {
                "key": key,
                "label": label,
                "labelFa": label_fa,
                "users": users,
                "sharePct": _share_pct(users, total_users),
            }
        )
    return {"counts": counts, "slices": slices, "free": free}


def _ticket_totals() -> dict:
    row = SupportTicket.objects.aggregate(
        total=Count("id"),
        open=Count("id", filter=Q(status=SupportTicket.Status.OPEN)),
        answered=Count("id", filter=Q(status=SupportTicket.Status.ANSWERED)),
        closed=Count("id", filter=Q(status=SupportTicket.Status.CLOSED)),
    )
    unresolved = row["open"] + row["answered"]
    return {
        "totalTickets": row["total"],
        "openTickets": row["open"],
        "answeredTickets": row["answered"],
        "resolvedTickets": row["closed"],
        "unresolvedTickets": unresolved,
        # `pendingTickets` is the legacy alias the stats cards already bind to.
        "pendingTickets": unresolved,
        "resolutionRatePct": _share_pct(row["closed"], row["total"]),
    }


def _payout_totals() -> dict:
    return ArtistPayout.objects.aggregate(
        pending_amount=Coalesce(
            Sum(
                "reward_amount",
                filter=Q(status=ArtistPayout.Status.PENDING),
                output_field=MONEY,
            ),
            ZERO,
        ),
        settled_amount=Coalesce(
            Sum(
                "reward_amount",
                filter=Q(status=ArtistPayout.Status.SETTLED),
                output_field=MONEY,
            ),
            ZERO,
        ),
    )


def _revenue_trend(now, months: int = 6) -> list:
    """Successful payment revenue bucketed by calendar month."""
    since = (now.replace(day=1) - timedelta(days=31 * (months - 1))).replace(day=1)
    rows = (
        PaymentTransaction.objects.filter(
            status=PaymentTransaction.Status.SUCCESS, created_at__gte=since
        )
        .annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(revenue=Coalesce(Sum("amount", output_field=MONEY), ZERO), payments=Count("id"))
        .order_by("month")
    )
    return [
        {
            "month": row["month"].strftime("%Y-%m"),
            "revenue": _f(row["revenue"]),
            "payments": row["payments"],
        }
        for row in rows
    ]


def _top_artists(limit: int = 5) -> list:
    rows = (
        User.objects.filter(role=UserRole.ARTIST)
        .annotate(
            streams=Count("stream_events_received"),
            listeners=Count("stream_events_received__user", distinct=True),
        )
        .filter(streams__gt=0)
        .order_by("-streams")[:limit]
    )
    return [
        {
            "id": str(artist.id),
            "name": artist.full_name or artist.username,
            "streams": artist.streams,
            "uniqueListeners": artist.listeners,
            "revenue": round(artist.streams * float(REVENUE_PER_STREAM), 2),
        }
        for artist in rows
    ]


def _top_songs(limit: int = 5) -> list:
    rows = (
        Song.objects.select_related("artist")
        .annotate(plays=Count("stream_events"))
        .filter(plays__gt=0)
        .order_by("-plays")[:limit]
    )
    return [
        {
            "id": str(song.id),
            "title": song.title,
            "artistName": song.artist.full_name or song.artist.username,
            "genre": song.genre,
            "plays": song.plays,
        }
        for song in rows
    ]


# --- Support report -------------------------------------------------------
def build_support_report() -> dict:
    """Moderation and ticket-workload report for support staff (and admins).

    A superset of the legacy `/api/support/stats/` payload, so the existing
    stat cards keep binding to `totalUsers` / `totalArtists` / `activeArtists`
    / `pendingTickets` unchanged.
    """
    now = timezone.now()
    last_7d = now - timedelta(days=7)

    people = User.objects.aggregate(
        total_users=Count("id", filter=Q(role__in=[UserRole.LISTENER, UserRole.ARTIST])),
        total_artists=Count("id", filter=Q(role=UserRole.ARTIST)),
        active_artists=Count(
            "id", filter=Q(role=UserRole.ARTIST, status=AccountStatus.ACTIVE)
        ),
        banned_users=Count("id", filter=Q(status=AccountStatus.BANNED)),
    )

    verifications = ArtistProfile.objects.aggregate(
        pending=Count("id", filter=Q(verification_status="pending")),
        verified=Count("id", filter=Q(verification_status="verified")),
        rejected=Count("id", filter=Q(verification_status="rejected")),
    )

    tickets = _ticket_totals()
    tickets["ticketsLast7Days"] = SupportTicket.objects.filter(
        created_at__gte=last_7d
    ).count()

    return {
        "generatedAt": now.isoformat(),
        "totalUsers": people["total_users"],
        "totalArtists": people["total_artists"],
        "activeArtists": people["active_artists"],
        "bannedUsers": people["banned_users"],
        "pendingVerifications": verifications["pending"],
        "verifiedArtists": verifications["verified"],
        "rejectedArtists": verifications["rejected"],
        **tickets,
    }


# --- Artist report --------------------------------------------------------
def build_artist_report(artist: User) -> dict:
    """Catalog performance for one artist, scoped to their own songs."""
    now = timezone.now()

    # Artist-level unique listeners must be counted across the whole catalog:
    # summing per-track unique listeners would double-count anyone who played
    # two of this artist's songs.
    totals = StreamEvent.objects.filter(artist=artist).aggregate(
        total_streams=Count("id"),
        unique_listeners=Count("user", distinct=True),
        streams_30d=Count("id", filter=Q(created_at__gte=now - timedelta(days=30))),
    )

    tracks = (
        Song.objects.filter(artist=artist)
        .annotate(
            streams=Count("stream_events"),
            unique_listeners=Count("stream_events__user", distinct=True),
        )
        .annotate(
            revenue=ExpressionWrapper(
                F("streams") * Value(REVENUE_PER_STREAM), output_field=MONEY
            )
        )
        .order_by("-streams", "title")
    )

    track_rows = [
        {
            "id": str(song.id),
            "title": song.title,
            "genre": song.genre,
            "releaseType": song.release_type,
            "year": song.release_date.year,
            "streams": song.streams,
            "uniqueListeners": song.unique_listeners,
            "revenue": round(_f(song.revenue), 2),
        }
        for song in tracks
    ]

    total_streams = totals["total_streams"]
    total_revenue = round(total_streams * float(REVENUE_PER_STREAM), 2)

    payouts = ArtistPayout.objects.filter(artist=artist).aggregate(
        pending=Coalesce(
            Sum(
                "reward_amount",
                filter=Q(status=ArtistPayout.Status.PENDING),
                output_field=MONEY,
            ),
            ZERO,
        ),
        settled=Coalesce(
            Sum(
                "reward_amount",
                filter=Q(status=ArtistPayout.Status.SETTLED),
                output_field=MONEY,
            ),
            ZERO,
        ),
    )

    return {
        "currency": CURRENCY,
        "generatedAt": now.isoformat(),
        "revenuePerStream": float(REVENUE_PER_STREAM),
        "summary": {
            "trackCount": len(track_rows),
            "albumCount": Album.objects.filter(artist=artist).count(),
            "totalStreams": total_streams,
            "totalUniqueListeners": totals["unique_listeners"],
            "streamsLast30Days": totals["streams_30d"],
            "totalRevenue": total_revenue,
            "followerCount": artist.follower_links.count(),
        },
        "payouts": {
            "pendingAmount": _f(payouts["pending"]),
            "settledAmount": _f(payouts["settled"]),
        },
        "tracks": track_rows,
        "topTracks": track_rows[:5],
        "monthlyStreams": _artist_monthly_streams(artist, now),
        "genreBreakdown": _artist_genre_breakdown(artist),
    }


def _artist_monthly_streams(artist: User, now, months: int = 6) -> list:
    since = (now.replace(day=1) - timedelta(days=31 * (months - 1))).replace(day=1)
    rows = (
        StreamEvent.objects.filter(artist=artist, created_at__gte=since)
        .annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(streams=Count("id"), listeners=Count("user", distinct=True))
        .order_by("month")
    )
    return [
        {
            "month": row["month"].strftime("%Y-%m"),
            "streams": row["streams"],
            "uniqueListeners": row["listeners"],
        }
        for row in rows
    ]


def _artist_genre_breakdown(artist: User) -> list:
    """Which of this artist's genres pull the most streams."""
    rows = (
        StreamEvent.objects.filter(artist=artist)
        .values("song__genre")
        .annotate(streams=Count("id"))
        .order_by("-streams")
    )
    total = sum(row["streams"] for row in rows)
    return [
        {
            "genre": row["song__genre"] or "Unspecified",
            "streams": row["streams"],
            "sharePct": _share_pct(row["streams"], total),
        }
        for row in rows
    ]
