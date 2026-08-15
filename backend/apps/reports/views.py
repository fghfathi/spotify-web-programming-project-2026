"""Reporting API (part 3.7).

Each view is a thin, role-gated wrapper around a service in `services.py`.
Views hold no arithmetic: they authorize the caller, call one builder, and
return the finished payload.
"""

from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsAdmin, IsArtist, IsSupportOrAdmin

from .services import build_admin_report, build_artist_report, build_support_report


class AdminReportView(APIView):
    """GET /api/reports/admin/ — platform-wide report (admin only)."""

    permission_classes = [IsAdmin]

    def get(self, request):
        return Response(build_admin_report())


class SupportReportView(APIView):
    """GET /api/reports/support/ — moderation & ticket report (support/admin)."""

    permission_classes = [IsSupportOrAdmin]

    def get(self, request):
        return Response(build_support_report())


class ArtistReportView(APIView):
    """GET /api/reports/artist/ — the signed-in artist's own performance."""

    permission_classes = [IsArtist]

    def get(self, request):
        return Response(build_artist_report(request.user))
