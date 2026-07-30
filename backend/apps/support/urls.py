"""Support/admin routes (all under /api/support/)."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ArtistVerificationViewSet,
    AuditLogView,
    ManagedUserViewSet,
    PlatformStatsView,
)

router = DefaultRouter(trailing_slash=False)
router.register(
    r"support/artist-verifications",
    ArtistVerificationViewSet,
    basename="artist-verification",
)
router.register(r"support/users", ManagedUserViewSet, basename="managed-user")

urlpatterns = [
    path("support/stats", PlatformStatsView.as_view(), name="support-stats"),
    path("support/audits", AuditLogView.as_view(), name="support-audits"),
    path("", include(router.urls)),
]
