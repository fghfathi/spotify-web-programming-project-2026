"""Support & auditing models (parts 10-11): tickets, replies, artist payouts."""

from django.conf import settings
from django.db import models


class SupportTicket(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        ANSWERED = "answered", "Answered"
        CLOSED = "closed", "Closed"

    subject = models.CharField(max_length=200)
    description = models.TextField()
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tickets",
    )
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.OPEN
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"#{self.pk} {self.subject}"


class TicketReply(models.Model):
    ticket = models.ForeignKey(
        SupportTicket, on_delete=models.CASCADE, related_name="replies"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ticket_replies",
    )
    message = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sent_at"]

    def __str__(self):
        return f"reply<{self.ticket_id}>"


class ArtistPayout(models.Model):
    """A monthly settlement row for an artist (finance/auditing panel)."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SETTLED = "settled", "Settled"

    artist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payouts",
    )
    period = models.CharField(max_length=7)  # e.g. "2026-07"
    unique_listeners = models.PositiveIntegerField(default=0)
    total_streams = models.PositiveIntegerField(default=0)
    reward_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-period", "-total_streams"]
        constraints = [
            models.UniqueConstraint(
                fields=["artist", "period"], name="unique_artist_period_payout"
            )
        ]

    def __str__(self):
        return f"payout<{self.artist_id}:{self.period}>"
