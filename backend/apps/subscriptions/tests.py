"""Tests for the payment gateway integration and subscription activation.

These lock down the full checkout lifecycle that the bug report exposed: a
transaction is created ``pending``, the browser is handed a *reachable* redirect
URL, the gateway callback drives verification, and the transaction lands in
exactly one of ``success`` / ``failed`` — with the subscription activated only on
success, and duplicate callbacks never corrupting a finalized transaction.
"""

from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole

from .models import PaymentTransaction, SubscriptionPlan, UserSubscription
from .services import initiate_payment


def make_user(email, role=UserRole.LISTENER, **extra):
    return User.objects.create_user(email=email, password="pw12345678", role=role, **extra)


@override_settings(
    PAYMENT_GATEWAY_MODE="simulate",
    PAYMENT_GATEWAY_SIMULATE_URL="http://127.0.0.1:8000/api/payments/simulate/",
    PAYMENT_CALLBACK_URL="http://127.0.0.1:8000/api/payments/callback/",
    FRONTEND_BASE_URL="http://localhost:3000",
)
class PaymentFlowTests(TestCase):
    def setUp(self):
        self.user = make_user("buyer@t.com")
        self.plan = SubscriptionPlan.objects.create(
            title="Silver", tier="silver", price=50000, duration_days=30
        )
        self.callback_url = reverse("payment-callback")

    # --- initiation -------------------------------------------------------
    def test_initiate_creates_pending_and_returns_local_redirect(self):
        """The redirect must be reachable (our simulate page), not the real,
        unreachable startpay URL that produced the 'transaction not found' bug."""
        txn, redirect_url = initiate_payment(self.user, self.plan)

        self.assertEqual(txn.status, PaymentTransaction.Status.PENDING)
        self.assertTrue(txn.gateway_transaction_id)
        self.assertIn("create", txn.raw_gateway_response)
        self.assertIn("/api/payments/simulate/", redirect_url)
        self.assertIn(txn.invoice_id, redirect_url)

    def test_initiate_api_returns_redirect_url(self):
        client = APIClient()
        client.force_authenticate(self.user)
        resp = client.post(reverse("payment-create"), {"planId": self.plan.id})
        self.assertEqual(resp.status_code, 201)
        self.assertIn("/api/payments/simulate/", resp.data["redirectUrl"])
        self.assertTrue(resp.data["invoiceId"])

    def test_simulate_page_renders_pay_and_cancel(self):
        txn, _ = initiate_payment(self.user, self.plan)
        resp = self.client.get(
            reverse("payment-simulate", args=[txn.invoice_id])
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b"Pay now", resp.content)
        self.assertIn(b"Cancel payment", resp.content)

    # --- successful callback ---------------------------------------------
    def test_successful_callback_activates_subscription(self):
        txn, _ = initiate_payment(self.user, self.plan)

        resp = self.client.get(
            self.callback_url,
            {
                "invoice_id": txn.invoice_id,
                "transid": txn.gateway_transaction_id,
                "status": "1",
                "tracking_number": "99887766",
            },
        )
        # The callback redirects the browser to the frontend result page.
        self.assertEqual(resp.status_code, 302)
        self.assertIn("status=success", resp["Location"])

        txn.refresh_from_db()
        self.assertEqual(txn.status, PaymentTransaction.Status.SUCCESS)
        self.assertEqual(txn.tracking_number, "99887766")
        self.assertIn("verify", txn.raw_gateway_response)
        self.assertTrue(
            self.user.subscriptions.filter(is_active=True).exists()
        )
        self.assertEqual(self.user.subscription_tier, "silver")

    def test_tracking_number_falls_back_to_verify_payload(self):
        """When the callback omits a tracking number, verify's value is used."""
        txn, _ = initiate_payment(self.user, self.plan)
        self.client.get(
            self.callback_url,
            {"invoice_id": txn.invoice_id, "status": "1"},
        )
        txn.refresh_from_db()
        self.assertEqual(txn.status, PaymentTransaction.Status.SUCCESS)
        # simulate verify returns tracking_number="trk-<transid>"
        self.assertTrue(txn.tracking_number.startswith("trk-"))

    # --- lookup by gateway identifier ------------------------------------
    def test_callback_lookup_by_transid_only(self):
        txn, _ = initiate_payment(self.user, self.plan)
        resp = self.client.get(
            self.callback_url,
            {"transid": txn.gateway_transaction_id, "status": "1"},
        )
        self.assertEqual(resp.status_code, 302)
        txn.refresh_from_db()
        self.assertEqual(txn.status, PaymentTransaction.Status.SUCCESS)

    def test_callback_unknown_transaction_redirects_failed(self):
        resp = self.client.get(
            self.callback_url, {"invoice_id": "does-not-exist", "status": "1"}
        )
        self.assertEqual(resp.status_code, 302)
        self.assertIn("status=failed", resp["Location"])

    # --- cancelled / failed callback -------------------------------------
    def test_cancelled_callback_marks_failed(self):
        txn, _ = initiate_payment(self.user, self.plan)
        resp = self.client.get(
            self.callback_url,
            {"invoice_id": txn.invoice_id, "status": "0"},
        )
        self.assertEqual(resp.status_code, 302)
        self.assertIn("status=failed", resp["Location"])

        txn.refresh_from_db()
        self.assertEqual(txn.status, PaymentTransaction.Status.FAILED)
        self.assertFalse(self.user.subscriptions.filter(is_active=True).exists())

    def test_verify_failure_marks_failed(self):
        txn, _ = initiate_payment(self.user, self.plan)
        with patch(
            "apps.subscriptions.services._gateway_verify",
            return_value=(False, {"code": "0", "reason": "declined"}),
        ):
            self.client.get(
                self.callback_url,
                {"invoice_id": txn.invoice_id, "status": "1"},
            )
        txn.refresh_from_db()
        self.assertEqual(txn.status, PaymentTransaction.Status.FAILED)
        self.assertIn("verify", txn.raw_gateway_response)
        self.assertFalse(self.user.subscriptions.filter(is_active=True).exists())

    # --- idempotency ------------------------------------------------------
    def test_duplicate_callback_does_not_corrupt_state(self):
        txn, _ = initiate_payment(self.user, self.plan)
        # First callback succeeds and activates the subscription.
        self.client.get(
            self.callback_url,
            {"invoice_id": txn.invoice_id, "status": "1"},
        )
        # A second, conflicting callback (e.g. a stray cancel retry) must be
        # ignored: the transaction stays success and no extra subscription is
        # created.
        self.client.get(
            self.callback_url,
            {"invoice_id": txn.invoice_id, "status": "0"},
        )
        txn.refresh_from_db()
        self.assertEqual(txn.status, PaymentTransaction.Status.SUCCESS)
        self.assertEqual(
            UserSubscription.objects.filter(user=self.user).count(), 1
        )

    def test_result_page_key_matches_invoice_id(self):
        """The frontend result page keys off invoice_id; the redirect must carry
        the same value the /payments/<invoice_id>/ status endpoint expects."""
        txn, _ = initiate_payment(self.user, self.plan)
        resp = self.client.get(
            self.callback_url, {"invoice_id": txn.invoice_id, "status": "1"}
        )
        query = parse_qs(urlparse(resp["Location"]).query)
        self.assertEqual(query["invoice"][0], txn.invoice_id)


@override_settings(
    PAYMENT_GATEWAY_MODE="simulate",
    PAYMENT_GATEWAY_SIMULATE_URL="http://127.0.0.1:8000/api/payments/simulate/",
    PAYMENT_CALLBACK_URL="http://127.0.0.1:8000/api/payments/callback/",
    FRONTEND_BASE_URL="http://localhost:3000",
)
class SubscriptionDurationTests(TestCase):
    """Each tier is purchasable for 1/3/6/12 months and the chosen duration is
    honoured by the backend for both the charged amount and the expiry date."""

    def setUp(self):
        self.user = make_user("dur@t.com")
        self.callback_url = reverse("payment-callback")

    def _plan(self, months, price):
        return SubscriptionPlan.objects.create(
            title="Gold", tier="gold", price=price, duration_days=months * 30
        )

    def test_amount_and_expiry_reflect_selected_duration(self):
        plan = self._plan(months=3, price=300000)
        txn, _ = initiate_payment(self.user, plan)
        # The charged amount is the plan's (duration-specific) price.
        self.assertEqual(int(txn.amount), 300000)

        self.client.get(
            self.callback_url, {"invoice_id": txn.invoice_id, "status": "1"}
        )
        sub = self.user.subscriptions.get(is_active=True)
        # Expiry is start + duration_days (90 days for a 3-month plan).
        delta_days = (sub.end_date - sub.start_date).days
        self.assertEqual(delta_days, 90)
        self.assertEqual(sub.plan_id, plan.id)

    def test_all_four_durations_activate_independently(self):
        for months in (1, 3, 6, 12):
            user = make_user(f"dur{months}@t.com")
            plan = self._plan(months=months, price=100000 * months)
            txn, _ = initiate_payment(user, plan)
            self.client.get(
                self.callback_url,
                {"invoice_id": txn.invoice_id, "status": "1"},
            )
            sub = user.subscriptions.get(is_active=True)
            self.assertEqual((sub.end_date - sub.start_date).days, months * 30)

    def test_plan_serializer_reports_duration_months(self):
        from .serializers import SubscriptionPlanSerializer

        plan = self._plan(months=6, price=600000)
        data = SubscriptionPlanSerializer(plan).data
        self.assertEqual(data["durationMonths"], 6)
        self.assertEqual(data["durationDays"], 180)
        self.assertEqual(data["price"], 600000)


class MySubscriptionExpiryTests(TestCase):
    """GET /api/me/subscription/ surfaces the expiry date used by Settings."""

    def setUp(self):
        self.user = make_user("me@t.com")
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.url = reverse("my-subscription")

    def test_no_subscription_returns_null(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["tier"], "free")
        self.assertIsNone(resp.data["subscription"])

    def test_active_subscription_returns_end_date(self):
        from django.utils import timezone
        from datetime import timedelta

        plan = SubscriptionPlan.objects.create(
            title="Gold", tier="gold", price=100000, duration_days=90
        )
        UserSubscription.objects.create(
            user=self.user,
            plan=plan,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=90),
            is_active=True,
        )
        resp = self.client.get(self.url)
        self.assertEqual(resp.data["tier"], "gold")
        self.assertIsNotNone(resp.data["subscription"])
        self.assertIn("endDate", resp.data["subscription"])
        self.assertTrue(resp.data["subscription"]["isActive"])
