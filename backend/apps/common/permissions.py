"""Role-Based Access Control (RBAC) permissions (Step 2).

The platform has four roles (listener, artist, support, admin). These DRF
permission classes gate endpoints by role. `admin` is always allowed wherever
`support` is, since admins are a superset of support staff.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsArtist(BasePermission):
    """Allow only authenticated users whose role is 'artist'."""

    message = "Only artist accounts may perform this action."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == "artist")


class IsSupportOrAdmin(BasePermission):
    """Allow support staff and admins (the moderation/management portal)."""

    message = "Only support staff or admins may access this resource."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.role in ("support", "admin")
        )


class IsAdmin(BasePermission):
    """Allow only admins (e.g. changing subscription pricing)."""

    message = "Only admins may perform this action."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == "admin")


class IsOwnerOrReadOnly(BasePermission):
    """Object-level: write access limited to the object's owner.

    The view must expose the owning user via an `owner` or `artist` attribute
    on the object, or override `get_owner`.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        owner = getattr(obj, "owner", None) or getattr(obj, "artist", None)
        return owner == request.user
