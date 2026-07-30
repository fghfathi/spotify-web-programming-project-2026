"""Subscription endpoints: plan catalog (+ admin pricing), purchase/renew,
current status, and payment history."""

from rest_framework import mixins, viewsets
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsAdminRole

from .models import Payment, SubscriptionPlan
from .serializers import (
    PaymentSerializer,
    PurchaseSerializer,
    SubscriptionPlanSerializer,
    SubscriptionStatusSerializer,
)
from .services import get_basic_plan, get_effective_plan, purchase_subscription


class SubscriptionPlanViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """GET plans (public); PATCH a plan's price/features (admin only).

    PUT is intentionally not exposed — only partial price/feature edits are
    ever needed. Lookups are by tier slug (e.g. /api/subscription-plans/gold).
    """

    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    lookup_field = "tier"
    http_method_names = ["get", "patch", "head", "options"]

    def get_permissions(self):
        if self.request.method in ("PATCH",):
            return [IsAdminRole()]
        return [AllowAny()]


class PurchaseView(APIView):
    """POST /api/subscriptions/purchase — buy or renew a Silver/Gold plan."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PurchaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sub, payment = purchase_subscription(
            request.user,
            tier=serializer.validated_data["tier"],
            months=serializer.validated_data["months"],
        )
        return Response(
            {
                "subscription": _status_payload(request.user),
                "payment": PaymentSerializer(payment).data,
            },
            status=201,
        )


class MySubscriptionView(APIView):
    """GET /api/me/subscription — the caller's current effective status."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(_status_payload(request.user))


class MyPaymentsView(ListAPIView):
    """GET /api/me/payments — the caller's purchase history."""

    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)


def _status_payload(user) -> dict:
    """Build the serialized subscription-status object for a user."""
    plan = get_effective_plan(user)
    sub = getattr(user, "subscription", None)
    on_paid = bool(sub and sub.is_active and plan.tier != get_basic_plan().tier)
    data = {
        "tier": plan.tier,
        "plan_name": plan.name,
        "is_active": True,  # Basic is always "active"
        "start_date": sub.start_date if on_paid else None,
        "end_date": sub.end_date if on_paid else None,
        "days_remaining": sub.days_remaining if on_paid else 0,
        "features": plan,
    }
    return SubscriptionStatusSerializer(data).data
