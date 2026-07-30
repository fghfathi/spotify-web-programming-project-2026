"""Support/admin management endpoints.

All routes require support staff or the system admin; role assignment is
admin-only. Every privileged action writes an audit-log entry.
"""

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import AccountStatus, ArtistProfile, User, UserRole
from apps.common.permissions import IsAdminRole, IsSupportOrAdmin
from apps.subscriptions.models import Subscription

from .models import AuditLog
from .serializers import (
    ArtistVerificationSerializer,
    AuditLogSerializer,
    ManagedUserSerializer,
    RejectSerializer,
    SetRoleSerializer,
)
from .services import record_audit

MANAGEABLE_ROLES = (UserRole.LISTENER, UserRole.ARTIST)


class ArtistVerificationViewSet(
    mixins.ListModelMixin, viewsets.GenericViewSet
):
    """Artist application queue + approve/reject actions."""

    serializer_class = ArtistVerificationSerializer
    permission_classes = [IsSupportOrAdmin]

    def get_queryset(self):
        qs = ArtistProfile.objects.select_related("user").order_by("created_at")
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(verification_status=status_param)
        return qs

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        profile = get_object_or_404(ArtistProfile, pk=pk)
        profile.verification_status = ArtistProfile.VerificationStatus.VERIFIED
        profile.rejection_reason = ""
        profile.save(update_fields=["verification_status", "rejection_reason"])
        record_audit(request.user, "artist.approve", f"artist_profile:{profile.pk}")
        return Response(self.get_serializer(profile).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        profile = get_object_or_404(ArtistProfile, pk=pk)
        serializer = RejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile.verification_status = ArtistProfile.VerificationStatus.REJECTED
        profile.rejection_reason = serializer.validated_data["reason"]
        profile.save(update_fields=["verification_status", "rejection_reason"])
        record_audit(
            request.user,
            "artist.reject",
            f"artist_profile:{profile.pk}",
            note=profile.rejection_reason,
        )
        return Response(self.get_serializer(profile).data)


class ManagedUserViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Support user management: list, ban/unban, and (admin) role assignment."""

    serializer_class = ManagedUserSerializer
    permission_classes = [IsSupportOrAdmin]

    def get_queryset(self):
        qs = User.objects.filter(
            role__in=[UserRole.LISTENER, UserRole.ARTIST, UserRole.SUPPORT]
        ).order_by("-date_joined")
        role = self.request.query_params.get("role")
        status_param = self.request.query_params.get("status")
        if role:
            qs = qs.filter(role=role)
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    def _guard_target(self, target, actor):
        if target == actor:
            raise PermissionDenied("You cannot moderate your own account.")
        if target.role not in MANAGEABLE_ROLES:
            raise PermissionDenied("Support and admin accounts cannot be banned.")

    @action(detail=True, methods=["post"])
    def ban(self, request, pk=None):
        target = get_object_or_404(User, pk=pk)
        self._guard_target(target, request.user)
        target.status = AccountStatus.BANNED
        target.is_active = False  # blocks existing JWTs and new logins
        target.save(update_fields=["status", "is_active"])
        record_audit(request.user, "user.ban", f"user:{target.pk}")
        return Response(self.get_serializer(target).data)

    @action(detail=True, methods=["post"])
    def unban(self, request, pk=None):
        target = get_object_or_404(User, pk=pk)
        target.status = AccountStatus.ACTIVE
        target.is_active = True
        target.save(update_fields=["status", "is_active"])
        record_audit(request.user, "user.unban", f"user:{target.pk}")
        return Response(self.get_serializer(target).data)

    @action(detail=True, methods=["post"], url_path="set-role", permission_classes=[IsAdminRole])
    def set_role(self, request, pk=None):
        """Admin-only: promote a listener to support staff, or demote back."""
        target = get_object_or_404(User, pk=pk)
        if target == request.user or target.is_superuser:
            raise PermissionDenied("You cannot change this account's role.")
        serializer = SetRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target.role = serializer.validated_data["role"]
        target.save(update_fields=["role"])
        record_audit(
            request.user, "user.set_role", f"user:{target.pk}", note=target.role
        )
        return Response(self.get_serializer(target).data)


class AuditLogView(ListAPIView):
    """GET /api/support/audits — the privileged-action audit trail."""

    queryset = AuditLog.objects.select_related("actor")
    serializer_class = AuditLogSerializer
    permission_classes = [IsSupportOrAdmin]


class PlatformStatsView(APIView):
    """GET /api/support/stats — headline platform metrics for the dashboard."""

    permission_classes = [IsSupportOrAdmin]

    def get(self, request):
        verified = ArtistProfile.VerificationStatus.VERIFIED
        pending = ArtistProfile.VerificationStatus.PENDING
        return Response(
            {
                "total_users": User.objects.filter(
                    role__in=[UserRole.LISTENER, UserRole.ARTIST]
                ).count(),
                "total_artists": User.objects.filter(role=UserRole.ARTIST).count(),
                "verified_artists": ArtistProfile.objects.filter(
                    verification_status=verified
                ).count(),
                "pending_verifications": ArtistProfile.objects.filter(
                    verification_status=pending
                ).count(),
                "banned_users": User.objects.filter(
                    status=AccountStatus.BANNED
                ).count(),
                "active_subscriptions": Subscription.objects.filter(
                    end_date__gte=timezone.now()
                ).count(),
            }
        )
