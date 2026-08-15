"""Tests for the reporting API (part 3.7).

The contract these lock down: the backend returns finished numbers, they are
arithmetically correct, and each report is reachable only by its own role.
"""

from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import ArtistProfile, User, UserRole
from apps.catalog.models import Album, Song
from apps.streaming.models import StreamEvent
from apps.subscriptions.models import PaymentTransaction, SubscriptionPlan, UserSubscription
from apps.support.models import SupportTicket

from .services import build_admin_report, build_artist_report, build_support_report


def make_user(email, role=UserRole.LISTENER, **extra):
    return User.objects.create_user(email=email, password="pw12345678", role=role, **extra)


class ReportDataMixin:
    """A small, hand-countable fixture: every expected number is obvious."""

    @classmethod
    def build_world(cls):
        cls.admin = make_user("admin@t.com", UserRole.ADMIN)
        cls.support = make_user("support@t.com", UserRole.SUPPORT)
        cls.listener = make_user("listener@t.com", UserRole.LISTENER)
        cls.listener2 = make_user("listener2@t.com", UserRole.LISTENER)
        cls.artist = make_user("artist@t.com", UserRole.ARTIST, full_name="Nova")
        cls.artist2 = make_user("artist2@t.com", UserRole.ARTIST, full_name="Rune")
        ArtistProfile.objects.create(user=cls.artist, verification_status="verified")
        ArtistProfile.objects.create(user=cls.artist2, verification_status="pending")

        cls.album = Album.objects.create(
            artist=cls.artist, title="Debut", release_date="2026-01-01"
        )
        cls.song_a = Song.objects.create(
            artist=cls.artist, album=cls.album, title="A",
            release_date="2026-01-01", genre="Indie", audio_file="songs/a.mp3",
        )
        cls.song_b = Song.objects.create(
            artist=cls.artist, title="B",
            release_date="2026-01-02", genre="Jazz", audio_file="songs/b.mp3",
        )
        cls.song_c = Song.objects.create(
            artist=cls.artist2, title="C",
            release_date="2026-01-03", genre="Indie", audio_file="songs/c.mp3",
        )

        # 3 plays of A (2 distinct listeners), 1 play of B, 0 plays of C.
        for user in (cls.listener, cls.listener, cls.listener2):
            StreamEvent.objects.create(user=user, song=cls.song_a, artist=cls.artist)
        StreamEvent.objects.create(user=cls.listener, song=cls.song_b, artist=cls.artist)

        cls.silver = SubscriptionPlan.objects.create(
            title="Silver", tier="silver", price=Decimal("100"), duration_days=30
        )
        cls.gold = SubscriptionPlan.objects.create(
            title="Gold", tier="gold", price=Decimal("200"), duration_days=30
        )

        now = timezone.now()
        UserSubscription.objects.create(
            user=cls.listener, plan=cls.gold,
            start_date=now - timedelta(days=5), end_date=now + timedelta(days=25),
        )
        UserSubscription.objects.create(
            user=cls.listener2, plan=cls.silver,
            start_date=now - timedelta(days=5), end_date=now + timedelta(days=25),
        )

        PaymentTransaction.objects.create(
            user=cls.listener, plan=cls.gold, amount=Decimal("200"),
            status=PaymentTransaction.Status.SUCCESS, invoice_id="inv-1",
        )
        PaymentTransaction.objects.create(
            user=cls.listener2, plan=cls.silver, amount=Decimal("100"),
            status=PaymentTransaction.Status.SUCCESS, invoice_id="inv-2",
        )
        PaymentTransaction.objects.create(
            user=cls.listener2, plan=cls.silver, amount=Decimal("100"),
            status=PaymentTransaction.Status.FAILED, invoice_id="inv-3",
        )

        SupportTicket.objects.create(
            subject="s1", description="d", submitted_by=cls.listener, status="open"
        )
        SupportTicket.objects.create(
            subject="s2", description="d", submitted_by=cls.listener, status="answered"
        )
        SupportTicket.objects.create(
            subject="s3", description="d", submitted_by=cls.listener, status="closed"
        )


class AdminReportServiceTests(ReportDataMixin, TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.build_world()
        cls.report = build_admin_report()

    def test_counts_only_listeners_and_artists_as_users(self):
        # 2 listeners + 2 artists; staff and admin accounts are not "users".
        self.assertEqual(self.report["users"]["totalUsers"], 4)
        self.assertEqual(self.report["users"]["totalListeners"], 2)
        self.assertEqual(self.report["users"]["totalArtists"], 2)

    def test_content_and_play_totals(self):
        self.assertEqual(self.report["content"]["totalSongs"], 3)
        self.assertEqual(self.report["content"]["totalAlbums"], 1)
        self.assertEqual(self.report["plays"]["totalPlays"], 4)
        # 4 play events but only 2 distinct people.
        self.assertEqual(self.report["plays"]["uniqueListeners"], 2)

    def test_revenue_sums_only_successful_payments(self):
        self.assertEqual(self.report["revenue"]["totalRevenue"], 300.0)
        self.assertEqual(self.report["revenue"]["successfulPayments"], 2)
        self.assertEqual(self.report["revenue"]["failedPayments"], 1)

    def test_mrr_is_sum_of_active_plan_prices(self):
        # gold (200) + silver (100).
        self.assertEqual(self.report["revenue"]["monthlyRecurringRevenue"], 300.0)
        self.assertEqual(self.report["subscriptions"]["payingUsers"], 2)

    def test_renewal_does_not_double_count_a_subscriber(self):
        """A user who renews early holds two overlapping rows for a while.

        MRR and the paying-user count must still see them once.
        """
        now = timezone.now()
        UserSubscription.objects.create(
            user=self.listener, plan=self.gold,
            start_date=now - timedelta(days=1), end_date=now + timedelta(days=55),
        )
        report = build_admin_report()
        self.assertEqual(report["subscriptions"]["payingUsers"], 2)
        self.assertEqual(report["revenue"]["monthlyRecurringRevenue"], 300.0)
        self.assertEqual(report["subscriptions"]["distribution"]["gold"], 1)

    def test_tier_distribution_and_shares_are_precomputed(self):
        self.assertEqual(
            self.report["subscriptions"]["distribution"],
            {"free": 2, "silver": 1, "gold": 1},
        )
        slices = {s["key"]: s for s in self.report["analytics"]["distribution"]}
        # 2 of 4 users are on the free/basic tier.
        self.assertEqual(slices["basic"]["users"], 2)
        self.assertEqual(slices["basic"]["sharePct"], 50.0)
        # The frontend renders these labels rather than deriving them.
        self.assertEqual(slices["gold"]["label"], "Gold")

    def test_arpu_metric_is_computed_backend_side(self):
        metrics = {m["id"]: m for m in self.report["analytics"]["metrics"]}
        # MRR 300 across 2 paying users.
        self.assertEqual(metrics["arpu"]["value"], 150.0)
        self.assertEqual(metrics["paying"]["value"], 2)
        self.assertEqual(metrics["mrr"]["value"], 300.0)

    def test_resolved_vs_unresolved_tickets(self):
        tickets = self.report["tickets"]
        self.assertEqual(tickets["totalTickets"], 3)
        self.assertEqual(tickets["resolvedTickets"], 1)
        # open + answered.
        self.assertEqual(tickets["unresolvedTickets"], 2)
        self.assertEqual(tickets["pendingTickets"], 2)
        self.assertAlmostEqual(tickets["resolutionRatePct"], 33.3, places=1)

    def test_top_songs_are_ranked_and_exclude_unplayed(self):
        titles = [s["title"] for s in self.report["topSongs"]]
        self.assertEqual(titles, ["A", "B"])
        self.assertEqual(self.report["topSongs"][0]["plays"], 3)


class SupportReportServiceTests(ReportDataMixin, TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.build_world()

    def test_superset_of_legacy_platform_stats_keys(self):
        report = build_support_report()
        for key in ("totalUsers", "totalArtists", "activeArtists", "pendingTickets"):
            self.assertIn(key, report)
        self.assertEqual(report["totalArtists"], 2)
        self.assertEqual(report["activeArtists"], 2)

    def test_verification_queue_counts(self):
        report = build_support_report()
        self.assertEqual(report["pendingVerifications"], 1)
        self.assertEqual(report["verifiedArtists"], 1)


class ArtistReportServiceTests(ReportDataMixin, TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.build_world()

    def test_summary_is_scoped_to_the_artists_own_catalog(self):
        report = build_artist_report(self.artist)
        summary = report["summary"]
        # Song C belongs to the other artist.
        self.assertEqual(summary["trackCount"], 2)
        self.assertEqual(summary["totalStreams"], 4)

    def test_unique_listeners_are_not_summed_across_tracks(self):
        """listener played A and B; listener2 played only A.

        Per-track unique listeners are 2 and 1, but the artist reaches 2 people
        — the old frontend `reduce` would have reported 3.
        """
        report = build_artist_report(self.artist)
        self.assertEqual(report["summary"]["totalUniqueListeners"], 2)
        per_track = {t["title"]: t for t in report["tracks"]}
        self.assertEqual(per_track["A"]["uniqueListeners"], 2)
        self.assertEqual(per_track["B"]["uniqueListeners"], 1)

    def test_revenue_is_precomputed_per_track_and_in_total(self):
        report = build_artist_report(self.artist)
        rate = report["revenuePerStream"]
        per_track = {t["title"]: t for t in report["tracks"]}
        self.assertAlmostEqual(per_track["A"]["revenue"], round(3 * rate, 2))
        self.assertAlmostEqual(report["summary"]["totalRevenue"], round(4 * rate, 2))

    def test_tracks_are_sorted_by_streams_desc(self):
        report = build_artist_report(self.artist)
        self.assertEqual([t["title"] for t in report["tracks"]], ["A", "B"])

    def test_genre_breakdown_shares_sum_to_100(self):
        report = build_artist_report(self.artist)
        total = sum(row["sharePct"] for row in report["genreBreakdown"])
        self.assertAlmostEqual(total, 100.0, places=1)


class ReportPermissionTests(ReportDataMixin, TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.build_world()

    def _client_for(self, user):
        client = APIClient()
        if user is not None:
            client.force_authenticate(user=user)
        return client

    def test_admin_report_requires_admin(self):
        url = reverse("report-admin")
        self.assertEqual(self._client_for(None).get(url).status_code, 401)
        self.assertEqual(self._client_for(self.listener).get(url).status_code, 403)
        self.assertEqual(self._client_for(self.support).get(url).status_code, 403)
        self.assertEqual(self._client_for(self.admin).get(url).status_code, 200)

    def test_support_report_allows_support_and_admin(self):
        url = reverse("report-support")
        self.assertEqual(self._client_for(self.listener).get(url).status_code, 403)
        self.assertEqual(self._client_for(self.support).get(url).status_code, 200)
        self.assertEqual(self._client_for(self.admin).get(url).status_code, 200)

    def test_artist_report_requires_artist_and_is_self_scoped(self):
        url = reverse("report-artist")
        self.assertEqual(self._client_for(self.listener).get(url).status_code, 403)

        response = self._client_for(self.artist2).get(url)
        self.assertEqual(response.status_code, 200)
        # artist2 owns only song C, which has no plays.
        self.assertEqual(response.data["summary"]["trackCount"], 1)
        self.assertEqual(response.data["summary"]["totalStreams"], 0)

    def test_admin_report_ships_no_raw_records(self):
        """The frontend must not receive lists it would have to summarize."""
        response = self._client_for(self.admin).get(reverse("report-admin"))
        payload = response.data
        # Only bounded, ranked leaderboards — never the full user/song tables.
        self.assertLessEqual(len(payload["topSongs"]), 5)
        self.assertLessEqual(len(payload["topArtists"]), 5)
        self.assertNotIn("users", payload["users"].keys())
        self.assertIsInstance(payload["users"]["totalUsers"], int)
