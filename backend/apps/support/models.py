"""Support/admin models.

For step 3.3 this is a lightweight audit trail of privileged management actions
(artist verification, bans, role changes). Support tickets and artist payouts
are separate later features.
"""

from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    """An append-only record of a privileged action for the audit dashboard."""

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="audit_actions",
    )
    action = models.CharField(max_length=50)  # e.g. "artist.approve", "user.ban"
    target = models.CharField(max_length=100, blank=True)  # e.g. "user:5"
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} by {self.actor_id} on {self.target}"
