"""Support portal API (parts 10-11): user/artist management, tickets, platform
stats, finance/auditing, and subscription analytics."""

from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import ArtistProfile, User, UserRole
from apps.common.permissions import IsAdmin, IsSupportOrAdmin
from apps.subscriptions.models import SubscriptionPlan, UserSubscription

from .models import ArtistPayout, SupportTicket, TicketReply
from .serializers import (
    ArtistPayoutSerializer,
    ManagedArtistSerializer,
    ManagedUserSerializer,
    SupportTicketSerializer,
    TicketCreateSerializer,
    TicketReplySerializer,
)


# --- User management ------------------------------------------------------
class ManagedUserListView(generics.ListAPIView):
    """GET /api/support/users/ — listeners and artists for moderation."""

    serializer_class = ManagedUserSerializer
    permission_classes = [IsSupportOrAdmin]

    def get_queryset(self):
        return User.objects.filter(
            role__in=[UserRole.LISTENER, UserRole.ARTIST]
        )


class ManagedUserDetailView(APIView):
    """PATCH /api/support/users/<id>/ — change a user's status (ban/activate)."""

    permission_classes = [IsSupportOrAdmin]

    def patch(self, request, pk):
        user = get_object_or_404(
            User, pk=pk, role__in=[UserRole.LISTENER, UserRole.ARTIST]
        )
        new_status = request.data.get("status")
        if new_status not in ("active", "banned"):
            return Response(
                {"detail": "status must be 'active' or 'banned'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.status = new_status
        user.save(update_fields=["status"])
        return Response(ManagedUserSerializer(user).data)


# --- Artist management & verification ------------------------------------
class ManagedArtistListView(generics.ListAPIView):
    """GET /api/support/artists/ — artists with verification state."""

    serializer_class = ManagedArtistSerializer
    permission_classes = [IsSupportOrAdmin]

    def get_queryset(self):
        return User.objects.filter(role=UserRole.ARTIST).select_related(
            "artist_profile"
        )


class ArtistVerifyView(APIView):
    """POST /api/support/artists/<id>/verify/ — approve or reject an artist."""

    permission_classes = [IsSupportOrAdmin]

    def post(self, request, pk):
        artist = get_object_or_404(User, pk=pk, role=UserRole.ARTIST)
        action = request.data.get("action")
        profile, _ = ArtistProfile.objects.get_or_create(user=artist)

        if action == "verify":
            profile.verification_status = ArtistProfile.VerificationStatus.VERIFIED
            profile.rejection_reason = ""
        elif action == "reject":
            profile.verification_status = ArtistProfile.VerificationStatus.REJECTED
            profile.rejection_reason = request.data.get("reason", "")
        else:
            return Response(
                {"detail": "action must be 'verify' or 'reject'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        profile.save()
        return Response(ManagedArtistSerializer(artist).data)


# --- Tickets --------------------------------------------------------------
class TicketListView(generics.ListCreateAPIView):
    """GET /api/support/tickets/ — all tickets (staff) or own (regular users).
    POST creates a ticket for the current user."""

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return (
            TicketCreateSerializer
            if self.request.method == "POST"
            else SupportTicketSerializer
        )

    def get_queryset(self):
        qs = SupportTicket.objects.select_related("submitted_by").prefetch_related(
            "replies__author"
        )
        if self.request.user.role in ("support", "admin"):
            return qs
        return qs.filter(submitted_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user)


class TicketDetailView(APIView):
    """PATCH /api/support/tickets/<id>/ — update ticket status (staff)."""

    permission_classes = [IsSupportOrAdmin]

    def patch(self, request, pk):
        ticket = get_object_or_404(SupportTicket, pk=pk)
        new_status = request.data.get("status")
        if new_status not in ("open", "answered", "closed"):
            return Response(
                {"detail": "Invalid status."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ticket.status = new_status
        ticket.save(update_fields=["status", "updated_at"])
        return Response(SupportTicketSerializer(ticket).data)


class TicketReplyView(APIView):
    """POST /api/support/tickets/<id>/reply/ — staff replies to a ticket."""

    permission_classes = [IsSupportOrAdmin]

    def post(self, request, pk):
        ticket = get_object_or_404(SupportTicket, pk=pk)
        message = (request.data.get("message") or "").strip()
        if not message:
            return Response(
                {"detail": "message is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        TicketReply.objects.create(
            ticket=ticket, author=request.user, message=message
        )
        # A staff reply moves an open ticket to "answered".
        if ticket.status == SupportTicket.Status.OPEN:
            ticket.status = SupportTicket.Status.ANSWERED
            ticket.save(update_fields=["status", "updated_at"])
        return Response(
            SupportTicketSerializer(ticket).data, status=status.HTTP_201_CREATED
        )


# --- Platform stats -------------------------------------------------------
class PlatformStatsView(APIView):
    """GET /api/support/stats/ — headline platform counts."""

    permission_classes = [IsSupportOrAdmin]

    def get(self, request):
        artists = User.objects.filter(role=UserRole.ARTIST)
        return Response(
            {
                "totalUsers": User.objects.filter(
                    role__in=[UserRole.LISTENER, UserRole.ARTIST]
                ).count(),
                "totalArtists": artists.count(),
                "activeArtists": artists.filter(status="active").count(),
                "pendingTickets": SupportTicket.objects.exclude(
                    status=SupportTicket.Status.CLOSED
                ).count(),
            }
        )


# --- Finance / auditing ---------------------------------------------------
class FinanceView(APIView):
    """GET /api/support/finance/ — artist payout settlement rows."""

    permission_classes = [IsSupportOrAdmin]

    def get(self, request):
        payouts = ArtistPayout.objects.select_related("artist")
        return Response(
            {"payouts": ArtistPayoutSerializer(payouts, many=True).data}
        )


class PayoutSettleView(APIView):
    """POST /api/support/finance/payouts/<id>/settle/ — mark a payout settled
    (admin only)."""

    permission_classes = [IsAdmin]

    def post(self, request, pk):
        payout = get_object_or_404(ArtistPayout, pk=pk)
        payout.status = ArtistPayout.Status.SETTLED
        payout.save(update_fields=["status"])
        return Response(ArtistPayoutSerializer(payout).data)


# --- Subscription analytics & pricing ------------------------------------
def _subscription_distribution():
    active = UserSubscription.objects.filter(is_active=True).select_related("plan")
    gold = active.filter(plan__tier="gold").count()
    silver = active.filter(plan__tier="silver").count()
    total_listeners = User.objects.filter(
        role__in=[UserRole.LISTENER, UserRole.ARTIST]
    ).count()
    free = max(total_listeners - gold - silver, 0)
    return {"free": free, "silver": silver, "gold": gold}


def _plan_prices():
    silver = SubscriptionPlan.objects.filter(tier="silver", is_active=True).first()
    gold = SubscriptionPlan.objects.filter(tier="gold", is_active=True).first()
    return {
        "silver": int(silver.price) if silver else 0,
        "gold": int(gold.price) if gold else 0,
    }


class SubscriptionSettingsView(APIView):
    """GET /api/support/subscriptions/ — prices + tier distribution + revenue.
    PATCH updates plan prices (admin only)."""

    def get_permissions(self):
        if self.request.method == "PATCH":
            return [IsAdmin()]
        return [IsSupportOrAdmin()]

    def get(self, request):
        prices = _plan_prices()
        distribution = _subscription_distribution()
        monthly_revenue = (
            distribution["silver"] * prices["silver"]
            + distribution["gold"] * prices["gold"]
        )
        return Response(
            {
                "prices": prices,
                "distribution": distribution,
                "monthlyRevenue": monthly_revenue,
            }
        )

    def patch(self, request):
        updated = {}
        for tier in ("silver", "gold"):
            if tier in request.data:
                plan = SubscriptionPlan.objects.filter(tier=tier).first()
                if plan:
                    try:
                        plan.price = int(request.data[tier])
                        plan.save(update_fields=["price"])
                        updated[tier] = int(plan.price)
                    except (TypeError, ValueError):
                        return Response(
                            {"detail": f"Invalid price for {tier}."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
        return Response({"prices": _plan_prices(), "updated": updated})
