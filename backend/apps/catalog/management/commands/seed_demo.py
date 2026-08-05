"""Seed the database with demo accounts, catalog, and support data.

Idempotent: safe to run multiple times. Media files (audio + covers) are
copied from the frontend's public assets into MEDIA_ROOT so seeded songs are
actually playable and cards show real cover art.

Usage:
    python manage.py seed_demo
"""

import datetime
import random
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import ArtistProfile, User, UserRole
from apps.catalog.models import Album, Song
from apps.playlists.models import Playlist, PlaylistItem
from apps.streaming.models import StreamEvent
from apps.subscriptions.models import SubscriptionPlan
from apps.subscriptions.services import activate_subscription
from apps.support.models import ArtistPayout, SupportTicket, TicketReply

# Frontend public assets reused as real seed media.
FRONTEND_PUBLIC = (
    Path(settings.BASE_DIR).parent / "frontend" / "public"
)
AUDIO_SRC = FRONTEND_PUBLIC / "audio" / "test-track.mp3"
COVER_SRC = FRONTEND_PUBLIC / "images" / "cover-slow-burn.jpg"


class Command(BaseCommand):
    help = "Seed demo users, catalog, subscriptions and support data."

    def handle(self, *args, **options):
        self.stdout.write("Seeding demo data...")
        self._plans()
        admin = self._user("admin@shpotify.com", "admin12345", UserRole.ADMIN,
                           "Jordan Blake", is_staff=True, is_superuser=True)
        self._user("support@shpotify.com", "support12345", UserRole.SUPPORT,
                   "Sam Casey", is_staff=True)
        listener = self._user("listener@shpotify.com", "listener12345",
                              UserRole.LISTENER, "Alex Rivera")
        self._user("free@shpotify.com", "listener12345", UserRole.LISTENER,
                   "Priya Nair")

        artists = self._artists()
        songs = self._catalog(artists)
        self._subscriptions(listener, artists)
        self._playlists(listener, songs)
        self._streams(listener, songs)
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
        SubscriptionPlan.objects.get_or_create(
            tier="silver",
            defaults={
                "title": "Silver",
                "duration_days": 30,
                "price": 50000,
                "features": [
                    "Ad-free listening",
                    "Higher audio quality",
                    "Unlimited skips",
                ],
            },
        )
        SubscriptionPlan.objects.get_or_create(
            tier="gold",
            defaults={
                "title": "Gold",
                "duration_days": 30,
                "price": 100000,
                "features": [
                    "Everything in Silver",
                    "Early access to new releases",
                    "Lossless audio",
                    "Offline downloads",
                ],
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

    def _streams(self, listener, songs):
        if StreamEvent.objects.exists():
            return
        for song in songs:
            for _ in range(random.randint(3, 25)):
                StreamEvent.objects.create(
                    user=listener, song=song, artist=song.artist
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
