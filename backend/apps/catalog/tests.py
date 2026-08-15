"""Tests for catalog play/listener analytics.

Play count is the total number of StreamEvents; listener count is the number of
*distinct* users who played the track. Repeated plays by the same user increase
plays but not listeners.
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.streaming.models import StreamEvent

from .models import Song
from .serializers import SongSerializer


def make_user(email, role=UserRole.LISTENER, **extra):
    return User.objects.create_user(email=email, password="pw12345678", role=role, **extra)


class ListenerCountTests(TestCase):
    def setUp(self):
        self.artist = make_user("artist@t.com", UserRole.ARTIST, full_name="Nova")
        self.listener1 = make_user("l1@t.com")
        self.listener2 = make_user("l2@t.com")
        self.song = Song.objects.create(
            artist=self.artist,
            title="Track",
            audio_file="songs/track.mp3",
            release_date="2026-01-01",
        )

    def _play(self, user):
        StreamEvent.objects.create(
            user=user, song=self.song, artist=self.artist
        )

    def test_plays_vs_unique_listeners(self):
        # listener1 plays 3 times, listener2 plays once.
        self._play(self.listener1)
        self._play(self.listener1)
        self._play(self.listener1)
        self._play(self.listener2)

        self.assertEqual(self.song.plays_count, 4)
        self.assertEqual(self.song.listeners_count, 2)

    def test_no_plays(self):
        self.assertEqual(self.song.plays_count, 0)
        self.assertEqual(self.song.listeners_count, 0)

    def test_serializer_exposes_both_counts(self):
        self._play(self.listener1)
        self._play(self.listener1)
        data = SongSerializer(self.song).data
        self.assertEqual(data["playsCount"], 2)
        self.assertEqual(data["listenersCount"], 1)

    def test_record_stream_endpoint_returns_both_counts(self):
        client = APIClient()
        url = reverse("record-stream", args=[self.song.pk])

        client.force_authenticate(self.listener1)
        resp1 = client.post(url)
        self.assertEqual(resp1.status_code, 201)
        self.assertEqual(resp1.data["playsCount"], 1)
        self.assertEqual(resp1.data["listenersCount"], 1)

        # Same user plays again: plays go up, unique listeners stay at 1.
        resp2 = client.post(url)
        self.assertEqual(resp2.data["playsCount"], 2)
        self.assertEqual(resp2.data["listenersCount"], 1)

        # A different user: unique listeners becomes 2.
        client.force_authenticate(self.listener2)
        resp3 = client.post(url)
        self.assertEqual(resp3.data["playsCount"], 3)
        self.assertEqual(resp3.data["listenersCount"], 2)
