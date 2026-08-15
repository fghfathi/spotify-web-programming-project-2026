"""Tests for the hybrid recommendation engine (part 3.10).

The grading condition is that recommendations are *logically related* to the
user's taste and *not random*. These tests assert exactly that: given a
listener with a clear preference, the engine must rank the matching song above
an equally-popular song they have no affinity for.
"""

from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import Follow, User, UserRole
from apps.catalog.models import Song
from apps.streaming.models import StreamEvent
from apps.subscriptions.models import SubscriptionPlan, UserSubscription

from .engine import recommend_for_user


def make_user(email, role=UserRole.LISTENER):
    return User.objects.create_user(email=email, password="pw12345678", role=role)


def make_song(artist, title, genre, early=False, unlock=None):
    return Song.objects.create(
        artist=artist,
        title=title,
        genre=genre,
        release_date="2026-01-01",
        audio_file=f"songs/{title}.mp3",
        is_early_access=early,
        early_access_unlock_date=unlock,
    )


def play(user, song, times=1):
    for _ in range(times):
        StreamEvent.objects.create(user=user, song=song, artist=song.artist)


def titles(result):
    return [item["song"].title for item in result["items"]]


class ContentBasedTests(TestCase):
    """Genre affinity: what the user plays should shape what they are offered."""

    @classmethod
    def setUpTestData(cls):
        cls.artist = make_user("a@t.com", UserRole.ARTIST)
        cls.jazz_heard = make_song(cls.artist, "JazzHeard", "Jazz")
        cls.jazz_new = make_song(cls.artist, "JazzNew", "Jazz")
        cls.metal_new = make_song(cls.artist, "MetalNew", "Metal")

        cls.user = make_user("u@t.com")
        play(cls.user, cls.jazz_heard, times=10)

        # A different listener gives both unheard songs identical popularity,
        # so popularity cannot explain the ranking — only genre can.
        other = make_user("other@t.com")
        play(other, cls.jazz_new, times=5)
        play(other, cls.metal_new, times=5)

    def test_recommends_the_users_genre_over_an_equally_popular_one(self):
        result = recommend_for_user(self.user, limit=5)
        ranked = titles(result)
        self.assertIn("JazzNew", ranked)
        self.assertLess(ranked.index("JazzNew"), ranked.index("MetalNew"))

    def test_reason_names_the_genre(self):
        result = recommend_for_user(self.user, limit=5)
        top = result["items"][0]
        self.assertEqual(top["song"].title, "JazzNew")
        self.assertIn("Jazz", top["reason"])

    def test_never_recommends_an_already_played_song(self):
        result = recommend_for_user(self.user, limit=10)
        self.assertNotIn("JazzHeard", titles(result))

    def test_scores_are_deterministic_across_calls(self):
        """Nothing random: the same state must produce the same ranking."""
        first = recommend_for_user(self.user, limit=5)
        second = recommend_for_user(self.user, limit=5)
        self.assertEqual(titles(first), titles(second))
        self.assertEqual(
            [item["score"] for item in first["items"]],
            [item["score"] for item in second["items"]],
        )


class CollaborativeTests(TestCase):
    """Listeners with overlapping history should pull each other's discoveries."""

    @classmethod
    def setUpTestData(cls):
        cls.artist = make_user("a@t.com", UserRole.ARTIST)
        # Both candidates share one genre, so genre affinity applies equally to
        # them and only the collaborative signal can separate the two.
        cls.shared = make_song(cls.artist, "Shared", "Pop")
        cls.peer_pick = make_song(cls.artist, "PeerPick", "Pop")
        cls.stranger_pick = make_song(cls.artist, "StrangerPick", "Pop")
        cls.side_interest = make_song(cls.artist, "SideInterest", "Rock")

        cls.user = make_user("u@t.com")
        play(cls.user, cls.shared, times=5)
        # A second genre in the history keeps Pop affinity below 1.0, so the
        # collaborative term is the largest contributor and gets to explain the
        # suggestion.
        play(cls.user, cls.side_interest, times=7)

        # A peer with overlapping history who also plays PeerPick.
        peer = make_user("peer@t.com")
        play(peer, cls.shared, times=5)
        play(peer, cls.peer_pick, times=5)

        # A stranger with no overlap, whose taste should carry no weight. Given
        # more plays than the peer so popularity alone would rank them first.
        stranger = make_user("stranger@t.com")
        play(stranger, cls.stranger_pick, times=20)

    def test_peer_choice_outranks_a_more_popular_stranger_choice(self):
        result = recommend_for_user(self.user, limit=5)
        ranked = titles(result)
        self.assertLess(ranked.index("PeerPick"), ranked.index("StrangerPick"))

    def test_reason_cites_the_song_that_created_the_overlap(self):
        result = recommend_for_user(self.user, limit=5)
        top = next(i for i in result["items"] if i["song"].title == "PeerPick")
        self.assertIn("Shared", top["reason"])
        # "SideInterest" is this user's most-played song overall, but the peer
        # never played it, so it cannot explain the match.
        self.assertNotIn("SideInterest", top["reason"])


class ArtistAffinityTests(TestCase):
    def test_following_an_artist_lifts_their_unheard_songs(self):
        followed = make_user("followed@t.com", UserRole.ARTIST)
        other = make_user("other@t.com", UserRole.ARTIST)
        from_followed = make_song(followed, "FromFollowed", "Pop")
        from_other = make_song(other, "FromOther", "Pop")

        listener = make_user("u@t.com")
        Follow.objects.create(follower=listener, following=followed)

        # Equal popularity, so the follow is the only differentiator.
        crowd = make_user("crowd@t.com")
        play(crowd, from_followed, times=5)
        play(crowd, from_other, times=5)

        ranked = titles(recommend_for_user(listener, limit=5))
        self.assertLess(ranked.index("FromFollowed"), ranked.index("FromOther"))


class ColdStartTests(TestCase):
    def test_new_user_gets_popular_songs_not_an_empty_list(self):
        artist = make_user("a@t.com", UserRole.ARTIST)
        quiet = make_song(artist, "Quiet", "Pop")
        loud = make_song(artist, "Loud", "Pop")

        crowd = make_user("crowd@t.com")
        play(crowd, loud, times=10)
        play(crowd, quiet, times=1)

        newcomer = make_user("new@t.com")
        result = recommend_for_user(newcomer, limit=5)

        self.assertEqual(result["strategy"], "cold-start")
        self.assertEqual(result["basedOnPlays"], 0)
        self.assertEqual(titles(result)[0], "Loud")

    def test_empty_catalog_returns_no_items_rather_than_failing(self):
        newcomer = make_user("new@t.com")
        result = recommend_for_user(newcomer, limit=5)
        self.assertEqual(result["items"], [])


class GatingTests(TestCase):
    """A recommendation the player would refuse to start is a dead end."""

    @classmethod
    def setUpTestData(cls):
        cls.artist = make_user("a@t.com", UserRole.ARTIST)
        cls.locked = make_song(
            cls.artist, "Locked", "Pop",
            early=True, unlock=timezone.now() + timedelta(days=30),
        )
        cls.unlocked = make_song(
            cls.artist, "Unlocked", "Pop",
            early=True, unlock=timezone.now() - timedelta(days=1),
        )
        cls.no_date = make_song(cls.artist, "NoDate", "Pop", early=True)

        crowd = make_user("crowd@t.com")
        for song in (cls.locked, cls.unlocked, cls.no_date):
            play(crowd, song, times=5)

        cls.gold_plan = SubscriptionPlan.objects.create(
            title="Gold", tier="gold", price=100, duration_days=30
        )

    def test_free_listener_is_not_offered_locked_early_access(self):
        free_user = make_user("free@t.com")
        ranked = titles(recommend_for_user(free_user, limit=10))
        self.assertNotIn("Locked", ranked)
        # A missing unlock date also counts as locked, matching the player.
        self.assertNotIn("NoDate", ranked)
        # An expired unlock date is public, so it stays eligible.
        self.assertIn("Unlocked", ranked)

    def test_gold_listener_is_offered_locked_early_access(self):
        gold_user = make_user("gold@t.com")
        now = timezone.now()
        UserSubscription.objects.create(
            user=gold_user, plan=self.gold_plan,
            start_date=now - timedelta(days=1), end_date=now + timedelta(days=29),
        )
        ranked = titles(recommend_for_user(gold_user, limit=10))
        self.assertIn("Locked", ranked)

    def test_artist_is_not_recommended_their_own_song(self):
        ranked = titles(recommend_for_user(self.artist, limit=10))
        self.assertEqual(ranked, [])


class RecommendationApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.artist = make_user("a@t.com", UserRole.ARTIST)
        cls.heard = make_song(cls.artist, "Heard", "Jazz")
        cls.unheard = make_song(cls.artist, "Unheard", "Jazz")
        cls.user = make_user("u@t.com")
        play(cls.user, cls.heard, times=3)
        crowd = make_user("crowd@t.com")
        play(crowd, cls.unheard, times=3)

    def test_requires_authentication(self):
        self.assertEqual(APIClient().get(reverse("recommendations")).status_code, 401)

    def test_returns_song_reason_and_score(self):
        client = APIClient()
        client.force_authenticate(user=self.user)
        response = client.get(reverse("recommendations"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["strategy"], "hybrid")
        self.assertEqual(response.data["basedOnPlays"], 1)

        item = response.data["items"][0]
        self.assertEqual(item["song"]["title"], "Unheard")
        self.assertTrue(item["reason"])
        self.assertGreater(item["matchScore"], 0)
        self.assertIn("genreAffinity", item["breakdown"])

    def test_limit_is_clamped_to_a_sane_range(self):
        client = APIClient()
        client.force_authenticate(user=self.user)
        self.assertEqual(client.get(reverse("recommendations") + "?limit=0").status_code, 200)
        response = client.get(reverse("recommendations") + "?limit=999")
        self.assertEqual(response.status_code, 200)
        response = client.get(reverse("recommendations") + "?limit=abc")
        self.assertEqual(response.status_code, 200)
