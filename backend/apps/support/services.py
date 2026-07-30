"""Helpers for the support app."""

from .models import AuditLog


def record_audit(actor, action: str, target: str = "", note: str = "") -> AuditLog:
    """Write an audit-trail entry for a privileged action."""
    return AuditLog.objects.create(
        actor=actor, action=action, target=target, note=note
    )
