"""Subscription & payment API views (Step 6)."""

from urllib.parse import urlencode

from django.conf import settings
from django.shortcuts import get_object_or_404, redirect
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PaymentTransaction, SubscriptionPlan
from .serializers import (
    PaymentTransactionSerializer,
    SubscriptionPlanSerializer,
    UserSubscriptionSerializer,
)
from .services import GatewayError, initiate_payment, process_callback


class PlanListView(generics.ListAPIView):
    """GET /api/plans/ — the active subscription plans."""

    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SubscriptionPlan.objects.filter(is_active=True)


class MySubscriptionView(APIView):
    """GET /api/me/subscription/ — the current subscription and tier."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        sub = (
            request.user.subscriptions.filter(is_active=True)
            .select_related("plan")
            .order_by("-end_date")
            .first()
        )
        data = {
            "tier": request.user.subscription_tier,
            "subscription": (
                UserSubscriptionSerializer(sub, context={"request": request}).data
                if sub and sub.is_currently_active
                else None
            ),
        }
        return Response(data)


class PaymentInitiateView(APIView):
    """POST /api/payments/create/ — start a checkout for {planId}."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan_id = request.data.get("planId") or request.data.get("plan_id")
        if not plan_id:
            return Response(
                {"detail": "planId is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        plan = get_object_or_404(SubscriptionPlan, pk=plan_id, is_active=True)
        try:
            txn, redirect_url = initiate_payment(request.user, plan)
        except GatewayError as exc:
            return Response(
                {"detail": f"Could not start payment: {exc}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response(
            {
                "redirectUrl": redirect_url,
                "invoiceId": txn.invoice_id,
                "transId": txn.gateway_transaction_id,
            },
            status=status.HTTP_201_CREATED,
        )


class PaymentCallbackView(APIView):
    """GET/POST /api/payments/callback/ — gateway return URL.

    Verifies the transaction, activates the subscription on success, then
    redirects the browser to the frontend result page. Public because the
    gateway (not an authenticated SPA request) drives this call.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        return self._handle(request)

    def post(self, request):
        return self._handle(request)

    def _handle(self, request):
        params = {**request.GET.dict(), **request.data} if hasattr(
            request, "data"
        ) else request.GET.dict()
        invoice_id = params.get("invoice_id")
        transid = params.get("transid")
        status_param = params.get("status")
        tracking_number = params.get("tracking_number") or params.get("cardnumber")

        txn = None
        if invoice_id:
            txn = PaymentTransaction.objects.filter(invoice_id=invoice_id).first()
        if txn is None and transid:
            txn = PaymentTransaction.objects.filter(
                gateway_transaction_id=transid
            ).first()

        if txn is None:
            return self._redirect("failed", invoice_id or "", "Unknown transaction")

        updated = process_callback(txn, status_param, tracking_number)
        result = "success" if updated.status == "success" else "failed"
        return self._redirect(result, updated.invoice_id, "")

    @staticmethod
    def _redirect(result, invoice_id, message):
        query = urlencode(
            {"status": result, "invoice": invoice_id, "message": message}
        )
        target = f"{settings.FRONTEND_BASE_URL}/payment/result?{query}"
        return redirect(target)


class PaymentStatusView(APIView):
    """GET /api/payments/<invoice_id>/ — status of one transaction."""

    permission_classes = [IsAuthenticated]

    def get(self, request, invoice_id):
        txn = get_object_or_404(
            PaymentTransaction, invoice_id=invoice_id, user=request.user
        )
        return Response(
            PaymentTransactionSerializer(txn, context={"request": request}).data
        )


class PaymentHistoryView(generics.ListAPIView):
    """GET /api/payments/ — the current user's transaction history."""

    serializer_class = PaymentTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PaymentTransaction.objects.filter(user=self.request.user)
