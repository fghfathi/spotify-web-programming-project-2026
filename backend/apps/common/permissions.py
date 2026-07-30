"""Shared, reusable DRF permission classes.

Role hierarchy: listener < artist < support < admin. These classes implement
the role-based half of access control (step 3.3); subscription feature limits
are enforced separately in `apps.subscriptions.services`.
"""

from rest_framework import permissions

from apps.accounts.models import ArtistProfile, UserRole

VERIFIED = ArtistProfile.VerificationStatus.VERIFIED


def _role(user):
    return getattr(user, "role", None)


def _is_authed(user):
    return bool(user and user.is_authenticated)


def _is_verified_artist(user):
    if not _is_authed(user) or _role(user) != UserRole.ARTIST:
        return False
    profile = getattr(user, "artist_profile", None)
    return bool(profile and profile.verification_status == VERIFIED)


# --- Object-ownership guards --------------------------------------------

class IsOwnerOrReadOnly(permissions.BasePermission):
    """Read to anyone; write only to the object's owner.

    The owning attribute is configurable per-view (`owner_field`) so the same
    class serves songs/albums (`artist`) and playlists (`owner`).
    """

    owner_field = "owner"

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        owner_field = getattr(view, "owner_field", self.owner_field)
        return getattr(obj, owner_field, None) == request.user


class IsSelfOrReadOnly(permissions.BasePermission):
    """Allow write only when the object *is* the requesting user."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj == request.user


# --- Role-based guards ---------------------------------------------------

class IsAdminRole(permissions.BasePermission):
    """Only the system admin (role=admin or a Django superuser)."""

    def has_permission(self, request, view):
        u = request.user
        return bool(_is_authed(u) and (u.is_superuser or _role(u) == UserRole.ADMIN))


class IsSupportOrAdmin(permissions.BasePermission):
    """Support staff or the system admin."""

    def has_permission(self, request, view):
        u = request.user
        return bool(
            _is_authed(u)
            and (u.is_superuser or _role(u) in (UserRole.SUPPORT, UserRole.ADMIN))
        )


class IsListener(permissions.BasePermission):
    """A plain listener account (used to gate the artist-application flow)."""

    def has_permission(self, request, view):
        return bool(_is_authed(request.user) and _role(request.user) == UserRole.LISTENER)


class IsVerifiedArtist(permissions.BasePermission):
    """An artist whose account has been approved by support/admin."""

    message = "You must be an approved artist to perform this action."

    def has_permission(self, request, view):
        return _is_verified_artist(request.user)


class IsVerifiedArtistOrReadOnly(permissions.BasePermission):
    """Read to anyone; write only to approved artists.

    Combine with `IsOwnerOrReadOnly` for object-level owner checks on
    update/delete.
    """

    message = "Publishing requires an approved artist account."

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return _is_verified_artist(request.user)
