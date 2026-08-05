"""Payment gateway integration (Aqaye Pardakht) and subscription activation.

Flow (Step 6):
  1. initiate_payment(): create a pending PaymentTransaction, call the gateway
     `create` endpoint, store the returned `transid`, and return the URL the
     browser is redirected to.
  2. The gateway redirects back to our callback with a transid + status.
  3. process_callback(): on status "1" call the gateway `verify` endpoint; on a
     verified success, mark the transaction success and activate/extend the
     user's subscription. Otherwise mark it failed.

Set PAYMENT_GATEWAY_MODE="simulate" to run this flow without network access
during development; "sandbox" performs the real HTTP calls.
"""

import uuid
from datetime import timedelta

import requests
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from .models import PaymentTransaction, SubscriptionPlan, UserSubscription


class GatewayError(Exception):
    """Raised when the payment gateway cannot be reached or rejects a call."""


def _new_invoice_id() -> str:
    return uuid.uuid4().hex


def _startpay_url(transid: str) -> str:
    return f"{settings.PAYMENT_GATEWAY_STARTPAY_URL.rstrip('/')}/{transid}"


# --- Gateway HTTP calls ---------------------------------------------------
def _gateway_create(amount, callback, description, invoice_id):
    """Call the gateway `create` endpoint; return (transid, raw_response)."""
    if settings.PAYMENT_GATEWAY_MODE == "simulate":
        # Deterministic fake transid so the offline flow is fully exercisable.
        transid = f"sim-{invoice_id[:12]}"
        return transid, {"status": "success", "transid": transid, "simulated": True}

    payload = {
        "pin": settings.PAYMENT_GATEWAY_PIN,
        "amount": str(int(amount)),
        "callback": callback,
        "invoice_id": invoice_id,
        "description": description,
    }
    try:
        resp = requests.post(
            settings.PAYMENT_GATEWAY_CREATE_URL,
            json=payload,
            timeout=settings.PAYMENT_GATEWAY_TIMEOUT,
        )
        data = resp.json()
    except (requests.RequestException, ValueError) as exc:
        raise GatewayError(f"Gateway create request failed: {exc}") from exc

    # Aqaye Pardakht returns {"status": "success", "transid": "..."} on success.
    transid = data.get("transid")
    if data.get("status") != "success" or not transid:
        raise GatewayError(
            f"Gateway did not return a transid: {data}"
        )
    return str(transid), data


def _gateway_verify(amount, transid):
    """Call the gateway `verify` endpoint; return (is_verified, raw_response)."""
    if settings.PAYMENT_GATEWAY_MODE == "simulate":
        return True, {"code": "1", "transid": transid, "simulated": True}

    payload = {
        "pin": settings.PAYMENT_GATEWAY_PIN,
        "amount": str(int(amount)),
        "transid": transid,
    }
    try:
        resp = requests.post(
            settings.PAYMENT_GATEWAY_VERIFY_URL,
            json=payload,
            timeout=settings.PAYMENT_GATEWAY_TIMEOUT,
        )
        data = resp.json()
    except (requests.RequestException, ValueError) as exc:
        raise GatewayError(f"Gateway verify request failed: {exc}") from exc

    # code == 1 (int or str) indicates a verified, settled payment.
    verified = str(data.get("code")) == "1"
    return verified, data


# --- Subscription activation ---------------------------------------------
@transaction.atomic
def activate_subscription(user, plan: SubscriptionPlan) -> UserSubscription:
    """Create or extend the user's subscription for `plan.duration_days`.

    If the user already has an active subscription, its remaining time is
    preserved: the new period is appended to the later of now / current expiry.
    Any other active rows are deactivated so `subscription_tier` is unambiguous.
    """
    now = timezone.now()
    current = (
        user.subscriptions.filter(is_active=True, end_date__gte=now)
        .order_by("-end_date")
        .first()
    )
    base = current.end_date if current else now
    end_date = base + timedelta(days=plan.duration_days)

    # Deactivate any prior active subscriptions.
    user.subscriptions.filter(is_active=True).update(is_active=False)

    return UserSubscription.objects.create(
        user=user,
        plan=plan,
        start_date=now,
        end_date=end_date,
        is_active=True,
    )


# --- Orchestration --------------------------------------------------------
def initiate_payment(user, plan: SubscriptionPlan):
    """Create a pending transaction and hand back the gateway redirect URL."""
    invoice_id = _new_invoice_id()
    txn = PaymentTransaction.objects.create(
        user=user,
        plan=plan,
        amount=plan.price,
        status=PaymentTransaction.Status.PENDING,
        gateway="aqayepardakht",
        invoice_id=invoice_id,
    )

    callback = f"{settings.PAYMENT_CALLBACK_URL}?invoice_id={invoice_id}"
    description = f"Shpotify {plan.title} subscription"
    try:
        transid, raw = _gateway_create(plan.price, callback, description, invoice_id)
    except GatewayError:
        txn.status = PaymentTransaction.Status.FAILED
        txn.save(update_fields=["status", "updated_at"])
        raise

    txn.gateway_transaction_id = transid
    txn.raw_gateway_response = {"create": raw}
    txn.save(
        update_fields=[
            "gateway_transaction_id",
            "raw_gateway_response",
            "updated_at",
        ]
    )
    return txn, _startpay_url(transid)


@transaction.atomic
def process_callback(transaction_obj: PaymentTransaction, status_param, tracking_number):
    """Verify and finalize a transaction returning from the gateway.

    `status_param` is the gateway's redirect status ("1" success attempt,
    "0" user cancelled/failed). Returns the updated transaction.
    """
    txn = (
        PaymentTransaction.objects.select_for_update()
        .select_related("plan", "user")
        .get(pk=transaction_obj.pk)
    )

    # Idempotency: never re-process an already finalized transaction.
    if txn.status != PaymentTransaction.Status.PENDING:
        return txn

    raw = dict(txn.raw_gateway_response or {})

    if str(status_param) == "0":
        txn.status = PaymentTransaction.Status.FAILED
        raw["callback"] = {"status": status_param}
        txn.raw_gateway_response = raw
        txn.save(update_fields=["status", "raw_gateway_response", "updated_at"])
        return txn

    # status == "1": confirm with the gateway verify endpoint.
    try:
        verified, verify_raw = _gateway_verify(
            txn.amount, txn.gateway_transaction_id
        )
    except GatewayError as exc:
        verified, verify_raw = False, {"error": str(exc)}

    raw["callback"] = {"status": status_param, "tracking_number": tracking_number}
    raw["verify"] = verify_raw
    txn.raw_gateway_response = raw
    if tracking_number:
        txn.tracking_number = str(tracking_number)

    if verified:
        txn.status = PaymentTransaction.Status.SUCCESS
        txn.save()
        if txn.plan is not None:
            activate_subscription(txn.user, txn.plan)
    else:
        txn.status = PaymentTransaction.Status.FAILED
        txn.save()

    return txn
