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

import logging
import uuid
from datetime import timedelta

import requests
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from .models import PaymentTransaction, SubscriptionPlan, UserSubscription

logger = logging.getLogger(__name__)


class GatewayError(Exception):
    """Raised when the payment gateway cannot be reached or rejects a call."""


def _new_invoice_id() -> str:
    return uuid.uuid4().hex


def _startpay_url(transid: str) -> str:
    return f"{settings.PAYMENT_GATEWAY_STARTPAY_URL.rstrip('/')}/{transid}"


def _simulate_page_url(invoice_id: str) -> str:
    """URL of the backend-hosted stand-in gateway page (simulate mode only)."""
    return f"{settings.PAYMENT_GATEWAY_SIMULATE_URL.rstrip('/')}/{invoice_id}/"


def _extract_tracking_number(*sources) -> str:
    """Best-effort pull of a settlement/tracking reference from gateway data.

    Real gateways are inconsistent about the field name (``tracking_number``,
    ``track_id``, ``ref_id``, ``cardnumber`` …). Rather than hard-code one, scan
    the candidate payloads for the first known key that carries a value.
    """
    keys = ("tracking_number", "trackingNumber", "track_id", "tracking",
            "ref_id", "refid", "reference", "cardnumber", "card_number")
    for source in sources:
        if not isinstance(source, dict):
            continue
        for key in keys:
            value = source.get(key)
            if value:
                return str(value)
    return ""


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
        return True, {
            "code": "1",
            "transid": transid,
            "tracking_number": f"trk-{transid}",
            "simulated": True,
        }

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
    logger.info(
        "payment.create user=%s plan=%s amount=%s invoice_id=%s mode=%s",
        user.pk, plan.pk, plan.price, invoice_id, settings.PAYMENT_GATEWAY_MODE,
    )

    callback = f"{settings.PAYMENT_CALLBACK_URL}?invoice_id={invoice_id}"
    description = (
        f"Shpotify {plan.title} subscription ({plan.duration_days} days)"
    )
    try:
        transid, raw = _gateway_create(plan.price, callback, description, invoice_id)
    except GatewayError as exc:
        txn.status = PaymentTransaction.Status.FAILED
        txn.raw_gateway_response = {"create_error": str(exc)}
        txn.save(update_fields=["status", "raw_gateway_response", "updated_at"])
        logger.warning("payment.create_failed invoice_id=%s error=%s", invoice_id, exc)
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

    # In simulate mode the real startpay page is unreachable and would never
    # recognise our fabricated transid (it would show "transaction not found"
    # and never call back). Send the browser to the local stand-in gateway
    # instead, which drives the real callback so the flow completes.
    if settings.PAYMENT_GATEWAY_MODE == "simulate":
        redirect_url = _simulate_page_url(invoice_id)
    else:
        redirect_url = _startpay_url(transid)
    logger.info(
        "payment.created invoice_id=%s transid=%s redirect=%s",
        invoice_id, transid, redirect_url,
    )
    return txn, redirect_url


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
    logger.info(
        "payment.callback invoice_id=%s transid=%s status_param=%s current=%s",
        txn.invoice_id, txn.gateway_transaction_id, status_param, txn.status,
    )

    # Idempotency: never re-process an already finalized transaction. A gateway
    # may legitimately hit the callback more than once (retries, user refresh),
    # so a duplicate must return the existing outcome untouched.
    if txn.status != PaymentTransaction.Status.PENDING:
        logger.info(
            "payment.callback_duplicate invoice_id=%s already=%s",
            txn.invoice_id, txn.status,
        )
        return txn

    raw = dict(txn.raw_gateway_response or {})

    if str(status_param) == "0":
        txn.status = PaymentTransaction.Status.FAILED
        raw["callback"] = {"status": status_param, "tracking_number": tracking_number}
        txn.raw_gateway_response = raw
        txn.save(update_fields=["status", "raw_gateway_response", "updated_at"])
        logger.info("payment.failed invoice_id=%s reason=user_cancelled", txn.invoice_id)
        return txn

    # status == "1" (or any non-cancel value): confirm with the verify endpoint.
    try:
        verified, verify_raw = _gateway_verify(
            txn.amount, txn.gateway_transaction_id
        )
        logger.info(
            "payment.verify invoice_id=%s verified=%s response=%s",
            txn.invoice_id, verified, verify_raw,
        )
    except GatewayError as exc:
        verified, verify_raw = False, {"error": str(exc)}
        logger.warning("payment.verify_error invoice_id=%s error=%s", txn.invoice_id, exc)

    raw["callback"] = {"status": status_param, "tracking_number": tracking_number}
    raw["verify"] = verify_raw
    txn.raw_gateway_response = raw
    # Prefer the tracking number the gateway echoed on the callback, but fall
    # back to whatever the verify payload reports (field names vary by gateway).
    resolved_tracking = _extract_tracking_number(
        {"tracking_number": tracking_number}, verify_raw
    )
    if resolved_tracking:
        txn.tracking_number = resolved_tracking

    if verified:
        txn.status = PaymentTransaction.Status.SUCCESS
        txn.save()
        if txn.plan is not None:
            activate_subscription(txn.user, txn.plan)
        logger.info(
            "payment.success invoice_id=%s tracking=%s plan=%s",
            txn.invoice_id, txn.tracking_number, getattr(txn.plan, "pk", None),
        )
    else:
        txn.status = PaymentTransaction.Status.FAILED
        txn.save()
        logger.info("payment.failed invoice_id=%s reason=verify_declined", txn.invoice_id)

    return txn
