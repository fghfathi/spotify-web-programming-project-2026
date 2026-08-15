"""Seed the database with demo accounts, catalog, and support data.

Idempotent: safe to run multiple times. Media files (audio + covers) are
copied from the frontend's public assets into MEDIA_ROOT so seeded songs are
actually playable and cards show real cover art.

Usage:
    python manage.py seed_demo
"""

import datetime
import os
import random
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import ArtistProfile, Follow, User, UserRole
from apps.catalog.models import Album, Song
from apps.playlists.models import Playlist, PlaylistItem
from apps.streaming.models import StreamEvent
from apps.subscriptions.models import SubscriptionPlan
from apps.subscriptions.services import activate_subscription
from apps.support.models import ArtistPayout, SupportTicket, TicketReply

# Frontend public assets reused as real seed media. In the container the
# frontend tree is not a sibling of the backend, so SEED_MEDIA_DIR points at
# wherever those assets were mounted.
FRONTEND_PUBLIC = Path(
    os.getenv("SEED_MEDIA_DIR")
    or Path(settings.BASE_DIR).parent / "frontend" / "public"
)
AUDIO_SRC = FRONTEND_PUBLIC / "audio" / "test-track.mp3"
COVER_SRC = FRONTEND_PUBLIC / "images" / "cover-slow-burn.jpg"


class Command(BaseCommand):
    help = "Seed demo users, catalog, subscriptions and support data."

    def handle(self, *args, **options):
        self.stdout.write("Seeding demo data...")
        # Fixed seed: play counts vary per song but are identical across runs,
        # so the recommendations a reviewer sees match the ones documented.
        random.seed(20260709)
        self._plans()
        self._user("admin@shpotify.com", "admin12345", UserRole.ADMIN,
                   "Jordan Blake", is_staff=True, is_superuser=True)
        self._user("support@shpotify.com", "support12345", UserRole.SUPPORT,
                   "Sam Casey", is_staff=True)
        listener = self._user("listener@shpotify.com", "listener12345",
                              UserRole.LISTENER, "Alex Rivera")
        # Priya has no listening history on purpose: she is the cold-start demo.
        self._user("free@shpotify.com", "listener12345", UserRole.LISTENER,
                   "Priya Nair")

        artists = self._artists()
        songs = self._catalog(artists)
        songs += self._singles(artists)
        self._subscriptions(listener, artists)
        self._playlists(listener, songs)
        self._taste_listeners(songs)
        self._follows()
        self._tickets(artists, listener)
        self._payouts(artists)
        self.stdout.write(self.style.SUCCESS("Demo data seeded."))

    # --- helpers ----------------------------------------------------------
    def _user(self, email, password, role, full_name, is_staff=False,
              is_superuser=False):
        existing = User.objects.filter(email=email).first()
        if existing:
            return existing
        # create_user() auto-generates a unique username via the manager.
        user = User.objects.create_user(
            email=email,
            password=password,
            role=role,
            full_name=full_name,
            is_staff=is_staff,
            is_superuser=is_superuser,
        )
        self.stdout.write(f"  + user {email} ({role})")
        return user

    def _plans(self):
        # Each tier is purchasable for 1, 3, 6 or 12 months. The price scales
        # with the number of months (exact multiples of the monthly base) and
        # duration_days drives the subscription's expiry on activation. Keyed on
        # (tier, duration_days) so every tier/duration pair is its own plan row.
        tiers = {
            "silver": {
                "title": "Silver",
                "monthly_price": 50000,
                "features": [
                    "Ad-free listening",
                    "Higher audio quality",
                    "Unlimited skips",
                ],
            },
            "gold": {
                "title": "Gold",
                "monthly_price": 100000,
                "features": [
                    "Everything in Silver",
                    "Early access to new releases",
                    "Lossless audio",
                    "Offline downloads",
                ],
            },
        }
        for tier, spec in tiers.items():
            for months in (1, 3, 6, 12):
                SubscriptionPlan.objects.update_or_create(
                    tier=tier,
                    duration_days=months * 30,
                    defaults={
                        "title": spec["title"],
                        "price": spec["monthly_price"] * months,
                        "features": spec["features"],
                        "is_active": True,
                    },
                )

    def _artists(self):
        specs = [
            ("marlow@shpotify.com", "Marlow", "verified",
             "4 released albums, ~180K monthly listeners."),
            ("aviary@shpotify.com", "Aviary", "pending",
             "2 self-released EPs; press kit submitted."),
            ("renvale@shpotify.com", "Ren Vale", "verified",
             "6 releases over two years; verified press coverage."),
            ("junoray@shpotify.com", "Juno Ray", "pending",
             "Debut single at ~12K streams; sample-work link submitted."),
            ("nadia@shpotify.com", "Nadia Cross", "rejected",
             "No releases yet; application without sample work."),
        ]
        artists = {}
        for email, name, verif, portfolio in specs:
            user = self._user(email, "artist12345", UserRole.ARTIST, name)
            profile, _ = ArtistProfile.objects.get_or_create(user=user)
            profile.verification_status = verif
            profile.portfolio_summary = portfolio
            if verif == "rejected":
                profile.rejection_reason = "No sample work or portfolio provided."
            profile.save()
            artists[name] = user
        return artists

    def _attach_audio(self, song):
        if song.audio_file or not AUDIO_SRC.exists():
            return
        with open(AUDIO_SRC, "rb") as fh:
            song.audio_file.save(f"{song.title[:20]}.mp3", File(fh), save=False)

    def _attach_cover(self, obj):
        if obj.cover_image or not COVER_SRC.exists():
            return
        with open(COVER_SRC, "rb") as fh:
            obj.cover_image.save(f"cover-{obj.pk or 'x'}.jpg", File(fh), save=False)

    def _catalog(self, artists):
        songs = []
        catalog_spec = [
            ("Marlow", "Neon Hours", "2026-06-12",
             ["Midnight Static", "Hourglass"]),
            ("Aviary", "Static Bloom", "2026-06-20",
             ["Open Roads", "Drift"]),
            ("Ren Vale", "Glass City", "2026-06-25",
             ["Slow Burn", "Paper Moon"]),
        ]
        for artist_name, album_title, rel, tracks in catalog_spec:
            artist = artists[artist_name]
            album, created = Album.objects.get_or_create(
                artist=artist,
                title=album_title,
                defaults={"release_date": rel},
            )
            if created:
                self._attach_cover(album)
                album.save()
            for idx, track_title in enumerate(tracks):
                song, s_created = Song.objects.get_or_create(
                    artist=artist,
                    title=track_title,
                    defaults={
                        "album": album,
                        "release_date": rel,
                        "duration_seconds": random.randint(150, 260),
                        "genre": "Indie",
                        "lyrics": f"[Verse]\n{track_title} lyrics line one\n"
                        f"{track_title} lyrics line two",
                    },
                )
                if s_created:
                    self._attach_audio(song)
                    self._attach_cover(song)
                    song.save()
                songs.append(song)

        # A couple of Gold-only early-access singles.
        for artist_name, title in [("Marlow", "Aurora (Early)"),
                                    ("Ren Vale", "Skyline (Early)")]:
            artist = artists[artist_name]
            song, created = Song.objects.get_or_create(
                artist=artist,
                title=title,
                defaults={
                    "release_date": "2026-07-04",
                    "duration_seconds": random.randint(150, 240),
                    "genre": "Electronic",
                    "is_early_access": True,
                    "early_access_unlock_date": timezone.now()
                    + datetime.timedelta(days=14),
                },
            )
            if created:
                self._attach_audio(song)
                self._attach_cover(song)
                song.save()
            songs.append(song)
        return songs

    # Genre-varied singles. The recommendation engine keys off `genre`, so the
    # catalog needs several songs per genre for content-based scoring to mean
    # anything — a listener must be able to love a genre and still have an
    # unheard song in it. Each row is (artist, title, genre).
    SINGLES = [
        ("Marlow", "Glass Harbour", "Indie"),
        ("Marlow", "Copper Sky", "Electronic"),
        ("Marlow", "Low Tide", "Ambient"),
        ("Marlow", "Blue Note Rain", "Jazz"),
        ("Aviary", "Paper Planes", "Jazz"),
        ("Aviary", "Night Bus", "Hip-Hop"),
        ("Aviary", "Dust Engine", "Rock"),
        ("Ren Vale", "Velvet Room", "Jazz"),
        ("Ren Vale", "Iron Lung", "Rock"),
        ("Ren Vale", "Concrete Bloom", "Hip-Hop"),
        ("Juno Ray", "Paper Lanterns", "Indie"),
        ("Juno Ray", "First Light", "Electronic"),
        ("Juno Ray", "Static Hymn", "Rock"),
        ("Juno Ray", "Tidal Glass", "Ambient"),
        ("Nadia Cross", "Blue Hour", "Ambient"),
        ("Nadia Cross", "Grain", "Hip-Hop"),
        ("Nadia Cross", "Neon Drift", "Electronic"),
    ]

    def _singles(self, artists):
        songs = []
        for artist_name, title, genre in self.SINGLES:
            song, created = Song.objects.get_or_create(
                artist=artists[artist_name],
                title=title,
                defaults={
                    "release_date": "2026-06-30",
                    "duration_seconds": random.randint(150, 260),
                    "genre": genre,
                    "lyrics": f"[Verse]\n{title} lyrics line one\n{title} line two",
                },
            )
            if created:
                self._attach_audio(song)
                self._attach_cover(song)
                song.save()
            songs.append(song)
        return songs

    # Listeners with a deliberate genre bias, so the recommender has a real
    # taste signal to read. `overlap` names songs outside that genre which the
    # listener also plays; that shared history is what lets collaborative
    # filtering decide two listeners are similar.
    #
    # Each row is (email, name, favourite genre, cross-genre overlap titles).
    TASTE_PROFILES = [
        # Alex is the primary demo account. Indie, and a Gold member, so his
        # history can include an early-access track.
        ("listener@shpotify.com", "Alex Rivera", "Indie",
         ["Aurora (Early)", "Paper Planes"]),
        ("jazzfan@shpotify.com", "Nina Solis", "Jazz",
         ["Paper Moon", "Slow Burn"]),
        ("rockfan@shpotify.com", "Theo Marsh", "Rock",
         ["Midnight Static", "Drift"]),
        ("electrofan@shpotify.com", "Kai Nomura", "Electronic",
         ["Hourglass", "Open Roads"]),
        # Ada is Alex's indie peer. The rotation below hands her a different
        # slice of the indie catalog, so the songs she plays and he hasn't are
        # exactly what collaborative filtering should surface for him.
        ("indiefan@shpotify.com", "Ada Wren", "Indie",
         ["Midnight Static", "Open Roads"]),
    ]

    # Fraction of their favourite genre each listener has actually heard.
    # Anything less than 1.0 leaves the recommender room to suggest a song from
    # the genre the listener demonstrably loves.
    GENRE_COVERAGE = 0.7

    def _taste_listeners(self, songs):
        by_title = {song.title: song for song in songs}
        by_genre = {}
        for song in songs:
            # Early-access tracks are Gold-only. Reaching them through a
            # profile's `overlap` list is deliberate; sweeping them in with a
            # whole genre is not.
            if song.is_early_access:
                continue
            by_genre.setdefault(song.genre, []).append(song)

        for index, (email, name, genre, overlap_titles) in enumerate(self.TASTE_PROFILES):
            user = self._user(email, "listener12345", UserRole.LISTENER, name)
            if StreamEvent.objects.filter(user=user).exists():
                continue

            # Rotate the genre by the profile's position before taking the
            # first GENRE_COVERAGE of it. Two fans of the same genre therefore
            # hear overlapping but different subsets — which is precisely the
            # condition collaborative filtering needs to say anything useful.
            catalog = sorted(by_genre.get(genre, []), key=lambda s: s.title)
            rotated = catalog[index:] + catalog[:index]
            heard = rotated[: max(1, int(len(rotated) * self.GENRE_COVERAGE))]

            for song in heard:
                for _ in range(random.randint(6, 14)):
                    StreamEvent.objects.create(
                        user=user, song=song, artist=song.artist
                    )
            # A lighter history outside the favourite genre.
            for title in overlap_titles:
                song = by_title.get(title)
                if song is None or song in heard:
                    continue
                for _ in range(random.randint(2, 5)):
                    StreamEvent.objects.create(
                        user=user, song=song, artist=song.artist
                    )

            unheard = [song.title for song in rotated[len(heard):]]
            self.stdout.write(
                f"  + listening history for {name} ({genre}: heard "
                f"{len(heard)}/{len(catalog)}, unheard {unheard})"
            )

    def _follows(self):
        """A couple of follows so artist affinity has something to read."""
        pairs = [
            ("listener@shpotify.com", "marlow@shpotify.com"),
            ("jazzfan@shpotify.com", "renvale@shpotify.com"),
        ]
        for follower_email, artist_email in pairs:
            follower = User.objects.filter(email=follower_email).first()
            artist = User.objects.filter(email=artist_email).first()
            if follower and artist:
                Follow.objects.get_or_create(follower=follower, following=artist)

    def _subscriptions(self, listener, artists):
        # Give the demo listener an active Gold subscription (for early access).
        if not listener.subscriptions.filter(is_active=True).exists():
            gold = SubscriptionPlan.objects.get(tier="gold")
            activate_subscription(listener, gold)
        # Put one artist on Silver to populate the tier distribution.
        aviary = artists["Aviary"]
        if not aviary.subscriptions.filter(is_active=True).exists():
            silver = SubscriptionPlan.objects.get(tier="silver")
            activate_subscription(aviary, silver)

    def _playlists(self, listener, songs):
        pl, created = Playlist.objects.get_or_create(
            owner=listener, title="Late Night Drive",
            defaults={"is_public": True},
        )
        if created:
            self._attach_cover(pl)
            pl.save()
            for pos, song in enumerate(songs[:4]):
                PlaylistItem.objects.get_or_create(
                    playlist=pl, song=song, defaults={"position": pos}
                )
        Playlist.objects.get_or_create(
            owner=listener, title="Focus Flow", defaults={"is_public": False}
        )

    def _tickets(self, artists, listener):
        if SupportTicket.objects.exists():
            return
        t1 = SupportTicket.objects.create(
            subject="Unable to upload track",
            description="The upload form fails when the file is over 20MB.",
            submitted_by=artists["Aviary"],
            status="open",
        )
        t2 = SupportTicket.objects.create(
            subject="Payment for premium not reflected",
            description="Upgraded to Gold but the badge is not showing.",
            submitted_by=listener,
            status="answered",
        )
        TicketReply.objects.create(
            ticket=t2,
            author=User.objects.get(email="support@shpotify.com"),
            message="Thanks for reporting — which device and browser did you use?",
        )

    def _payouts(self, artists):
        period = timezone.now().strftime("%Y-%m")
        for name, artist in artists.items():
            streams = artist.stream_events_received.count()
            listeners = (
                artist.stream_events_received.values("user").distinct().count()
            )
            ArtistPayout.objects.get_or_create(
                artist=artist,
                period=period,
                defaults={
                    "unique_listeners": listeners,
                    "total_streams": streams,
                    "reward_amount": round(streams * 0.4, 2),
                    "status": "pending",
                },
            )
