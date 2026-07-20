from __future__ import annotations

import hashlib
import logging
import os
import re
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Set

from dotenv import load_dotenv
from fastapi import Request
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, HttpUrl, validator

import resend
from resend.webhooks._webhooks import Webhooks

load_dotenv()

logger = logging.getLogger("resend_events")

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "cape_ember_coffee")

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
RESEND_WEBHOOK_SECRET = os.environ.get("RESEND_WEBHOOK_SECRET", "")
EMAIL_AUTOMATION_MODE = os.environ.get("EMAIL_AUTOMATION_MODE", "disabled").lower()
EMAIL_TEST_ALLOWLIST = {
    email.strip().lower()
    for email in os.environ.get("EMAIL_TEST_ALLOWLIST", "").split(",")
    if email.strip()
}

BACKEND_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://capeembercoffee.co.za")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://capeembercoffee.co.za")

SEGMENT_IDS = {
    "ember_circle": os.environ.get("RESEND_SEGMENT_EMBER_CIRCLE", ""),
    "pending_confirmation": os.environ.get("RESEND_SEGMENT_PENDING_CONFIRMATION", ""),
    "no_purchase": os.environ.get("RESEND_SEGMENT_NO_PURCHASE", ""),
    "first_time_customer": os.environ.get("RESEND_SEGMENT_FIRST_TIME_CUSTOMER", ""),
    "repeat_customer": os.environ.get("RESEND_SEGMENT_REPEAT_CUSTOMER", ""),
    "vip": os.environ.get("RESEND_SEGMENT_VIP", ""),
    "landscape_bundle": os.environ.get("RESEND_SEGMENT_LANDSCAPE_BUNDLE", ""),
    "fynbos": os.environ.get("RESEND_SEGMENT_FYNBOS", ""),
    "garden_route": os.environ.get("RESEND_SEGMENT_GARDEN_ROUTE", ""),
    "karoo": os.environ.get("RESEND_SEGMENT_KAROO", ""),
    "ember_reserve": os.environ.get("RESEND_SEGMENT_EMBER_RESERVE", ""),
    "smooth_preference": os.environ.get("RESEND_SEGMENT_SMOOTH_PREFERENCE", ""),
    "bright_preference": os.environ.get("RESEND_SEGMENT_BRIGHT_PREFERENCE", ""),
    "bold_preference": os.environ.get("RESEND_SEGMENT_BOLD_PREFERENCE", ""),
    "moka_pot": os.environ.get("RESEND_SEGMENT_MOKA_POT", ""),
    "espresso": os.environ.get("RESEND_SEGMENT_ESPRESSO", ""),
    "plunger": os.environ.get("RESEND_SEGMENT_PLUNGER", ""),
    "inactive_45": os.environ.get("RESEND_SEGMENT_INACTIVE_45", ""),
    "inactive_90": os.environ.get("RESEND_SEGMENT_INACTIVE_90", ""),
    "suppressed": os.environ.get("RESEND_SEGMENT_SUPPRESSED", ""),
}

RESEND_EVENT_LOG_COLLECTION = os.environ.get("RESEND_EVENT_LOG_COLLECTION", "resend_event_logs")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]


def _is_valid_email(value: str) -> bool:
    try:
        EmailStr.validate(value)
        return True
    except Exception:
        return False


def _mask_email(value: Optional[str]) -> str:
    if not value:
        return ""
    local, _, domain = value.partition("@")
    safe_local = local[:2] + "***" if len(local) > 2 else "***"
    return f"{safe_local}@{domain}"


def _hash_email(value: Optional[str]) -> str:
    if not value:
        return ""
    return hashlib.sha256(value.lower().encode("utf-8")).hexdigest()


def _normalize_email(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    value = value.strip().lower()
    if _is_valid_email(value):
        return value
    return None


class EventName(str, Enum):
    subscriber_form_submitted = "subscriber.form_submitted"
    subscriber_confirmed = "subscriber.confirmed"
    subscriber_preferences_updated = "subscriber.preferences_updated"
    subscriber_unsubscribed = "subscriber.unsubscribed"
    product_viewed = "product.viewed"
    product_added_to_cart = "product.added_to_cart"
    product_removed_from_cart = "product.removed_from_cart"
    cart_updated = "cart.updated"
    cart_abandoned = "cart.abandoned"
    cart_recovered = "cart.recovered"
    checkout_started = "checkout.started"
    checkout_completed = "checkout.completed"
    checkout_failed = "checkout.failed"
    order_placed = "order.placed"
    order_payment_confirmed = "order.payment_confirmed"
    order_fulfilled = "order.fulfilled"
    order_shipped = "order.shipped"
    order_delivered = "order.delivered"
    order_cancelled = "order.cancelled"
    order_refunded = "order.refunded"
    review_request_eligible = "review.request_eligible"
    review_submitted = "review.submitted"
    customer_first_purchase = "customer.first_purchase"
    customer_repeat_purchase = "customer.repeat_purchase"
    customer_bundle_purchase = "customer.bundle_purchase"
    customer_inactive_45_days = "customer.inactive_45_days"
    customer_inactive_90_days = "customer.inactive_90_days"
    customer_birthday_month = "customer.birthday_month"


class EventStatus(str, Enum):
    pending = "pending"
    delivered_to_resend = "delivered_to_resend"
    failed = "failed"
    suppressed = "suppressed"


class LifecycleEventPayload(BaseModel):
    event_id: str = Field(default_factory=lambda: f"evt_{uuid.uuid4().hex}")
    event_name: EventName
    occurred_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    source: str = Field(default="cape_ember_website")
    customer_id: Optional[str] = None
    contact_id: Optional[str] = None
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    currency: str = Field(default="ZAR")
    properties: Dict[str, Any] = Field(default_factory=dict)

    @validator("occurred_at")
    def validate_occurred_at(cls, value: str) -> str:
        try:
            datetime.fromisoformat(value.replace("Z", "+00:00"))
            return value
        except Exception as exc:
            raise ValueError("occurred_at must be an ISO8601 timestamp") from exc

    @validator("source")
    def validate_source(cls, value: str) -> str:
        if not value or len(value.strip()) == 0:
            raise ValueError("source must be provided")
        return value.strip()

    @validator("email", pre=True, always=True)
    def normalize_email(cls, value: Optional[str]) -> Optional[EmailStr]:
        if value is None:
            return None
        normalized = _normalize_email(str(value))
        if not normalized:
            raise ValueError("email must be valid when provided")
        return normalized

    @validator("properties")
    def ensure_properties(cls, value: Dict[str, Any]) -> Dict[str, Any]:
        return value or {}

    @validator("first_name")
    def normalize_first_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = str(value).strip()
        return normalized if normalized else None

    @validator("customer_id", "contact_id")
    def normalize_ids(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = str(value).strip()
        return normalized if normalized else None

    @validator("email", always=True)
    def require_contact_identifier(cls, value: Optional[str], values: Dict[str, Any]) -> Optional[EmailStr]:
        contact_id = values.get("contact_id")
        if not value and not contact_id:
            raise ValueError("either email or contact_id is required")
        return value


class ResendEventLog(BaseModel):
    event_id: str
    event_name: EventName
    customer_id: Optional[str]
    contact_email_hash: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    idempotency_key: Optional[str] = None
    payload_json: Dict[str, Any]
    status: EventStatus = EventStatus.pending
    attempts: int = 0
    last_error: Optional[str] = None
    occurred_at: str
    processed_at: Optional[str] = None
    created_at: str
    updated_at: str


def _resend_client() -> None:
    if not RESEND_API_KEY:
        raise RuntimeError("RESEND_API_KEY is not configured")
    resend.api_key = RESEND_API_KEY


def _is_production_mode() -> bool:
    return EMAIL_AUTOMATION_MODE == "production"


def _is_test_mode() -> bool:
    return EMAIL_AUTOMATION_MODE == "test"


def _is_disabled_mode() -> bool:
    return EMAIL_AUTOMATION_MODE == "disabled"


def _is_allowlisted_email(email: Optional[str]) -> bool:
    if not email:
        return False
    return email.lower() in EMAIL_TEST_ALLOWLIST


def _can_send_event(email: Optional[str]) -> bool:
    if _is_disabled_mode():
        return False
    if _is_test_mode():
        return _is_allowlisted_email(email)
    return True


def _sanitize_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    sanitized = {}
    for key, value in payload.items():
        if isinstance(value, (str, int, float, bool)) or value is None:
            sanitized[key] = value
        else:
            try:
                sanitized[key] = str(value)
            except Exception:
                sanitized[key] = None
    return sanitized


async def ensure_event_indexes() -> None:
    await db[RESEND_EVENT_LOG_COLLECTION].create_index("event_id", unique=True)
    await db[RESEND_EVENT_LOG_COLLECTION].create_index("idempotency_key", unique=True, sparse=True)
    await db.resend_webhook_events.create_index([("received_at", -1)])
    await db.resend_webhook_events.create_index([("event", 1), ("received_at", -1)])


async def _get_existing_event(idempotency_key: str) -> Optional[Dict[str, Any]]:
    if not idempotency_key:
        return None
    return await db[RESEND_EVENT_LOG_COLLECTION].find_one({"idempotency_key": idempotency_key})


async def _save_event_log(log: ResendEventLog) -> None:
    await db[RESEND_EVENT_LOG_COLLECTION].update_one(
        {"event_id": log.event_id},
        {"$set": log.dict()},
        upsert=True,
    )


async def emit_lifecycle_event(
    event_name: str,
    contact: Dict[str, Any],
    properties: Optional[Dict[str, Any]] = None,
    idempotency_key: Optional[str] = None,
    occurred_at: Optional[str] = None,
    customer_id: Optional[str] = None,
    contact_id: Optional[str] = None,
    first_name: Optional[str] = None,
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[str] = None,
    source: str = "cape_ember_website",
) -> Optional[Dict[str, Any]]:
    email = _normalize_email(contact.get("email")) if contact else None
    first_name = first_name or contact.get("first_name")
    payload_data = {
        "event_name": event_name,
        "customer_id": customer_id,
        "contact_id": contact_id,
        "email": email,
        "first_name": first_name,
        "properties": properties or {},
        "source": source,
        "occurred_at": occurred_at or datetime.now(timezone.utc).isoformat(),
    }

    try:
        payload = LifecycleEventPayload(
            event_name=event_name,
            customer_id=customer_id,
            contact_id=contact_id,
            email=email,
            first_name=first_name,
            properties=properties or {},
            source=source,
            occurred_at=occurred_at or datetime.now(timezone.utc).isoformat(),
        )
    except Exception as exc:
        logger.warning(
            "Lifecycle event validation failed",
            exc_info=True,
            extra={"event_name": event_name, "customer_id": customer_id, "email": _mask_email(email)},
        )
        return None

    existing = await _get_existing_event(idempotency_key) if idempotency_key else None
    if existing:
        if existing.get("status") == EventStatus.delivered_to_resend.value:
            return existing
        if existing.get("status") == EventStatus.suppressed.value:
            return existing

    event_log = ResendEventLog(
        event_id=payload.event_id,
        event_name=payload.event_name,
        customer_id=payload.customer_id,
        contact_email_hash=_hash_email(payload.email),
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
        idempotency_key=idempotency_key,
        payload_json=_sanitize_payload(payload.dict()),
        occurred_at=payload.occurred_at,
        created_at=datetime.now(timezone.utc).isoformat(),
        updated_at=datetime.now(timezone.utc).isoformat(),
    )

    if not _can_send_event(payload.email):
        event_log.status = EventStatus.suppressed
        event_log.attempts = 0
        event_log.last_error = "event suppressed by automation mode"
        event_log.processed_at = datetime.now(timezone.utc).isoformat()
        await _save_event_log(event_log)
        logger.info(
            "Lifecycle event suppressed",
            extra={
                "event_id": payload.event_id,
                "event_name": payload.event_name,
                "customer_id": payload.customer_id,
                "email": _mask_email(payload.email),
                "mode": EMAIL_AUTOMATION_MODE,
            },
        )
        return event_log.dict()

    try:
        _resend_client()
        params = resend.Events.SendParams(
            event=payload.event_name,
            email=payload.email if payload.email else None,
            contact_id=payload.contact_id if payload.contact_id else None,
            payload=payload.dict(),
        )
        response = await resend.Events.send_async(params)

        event_log.status = EventStatus.delivered_to_resend
        event_log.attempts = 1
        event_log.last_error = None
        event_log.processed_at = datetime.now(timezone.utc).isoformat()
        event_log.updated_at = event_log.processed_at
        await _save_event_log(event_log)

        logger.info(
            "Lifecycle event sent",
            extra={
                "event_id": payload.event_id,
                "event_name": payload.event_name,
                "customer_id": payload.customer_id,
                "email": _mask_email(payload.email),
                "resend_event_id": getattr(response, 'id', None),
            },
        )
        return response.__dict__ if hasattr(response, "__dict__") else {}
    except Exception as exc:
        event_log.status = EventStatus.failed
        event_log.attempts += 1
        event_log.last_error = str(exc)
        event_log.processed_at = datetime.now(timezone.utc).isoformat()
        event_log.updated_at = event_log.processed_at
        await _save_event_log(event_log)

        logger.error(
            "Lifecycle event delivery failed",
            exc_info=True,
            extra={
                "event_id": payload.event_id,
                "event_name": payload.event_name,
                "customer_id": payload.customer_id,
                "email": _mask_email(payload.email),
                "error": str(exc),
            },
        )
        return None


async def _get_resend_contact_by_email(email: str) -> Optional[Dict[str, Any]]:
    if not email:
        return None
    try:
        _resend_client()
        contact = await resend.Contacts.get_async(email=email)
        return contact.__dict__ if hasattr(contact, "__dict__") else None
    except Exception:
        return None


async def verify_resend_webhook(request: Request, body: bytes) -> Optional[Dict[str, Any]]:
    if not RESEND_WEBHOOK_SECRET:
        raise RuntimeError("RESEND_WEBHOOK_SECRET is not configured")

    payload = body.decode("utf-8") if body else ""
    headers = {
        "id": request.headers.get("svix-id", ""),
        "timestamp": request.headers.get("svix-timestamp", ""),
        "signature": request.headers.get("svix-signature", ""),
    }

    try:
        verified = Webhooks.verify({
            "payload": payload,
            "headers": headers,
            "webhook_secret": RESEND_WEBHOOK_SECRET,
        })
        logger.info("Resend webhook verified", extra={"event": verified.get("event"), "id": verified.get("id")})
        return verified
    except Exception as exc:
        logger.warning("Resend webhook verification failed", exc_info=True, extra={"error": str(exc), "headers": headers})
        raise


async def sync_resend_contact(
    email: str,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    properties: Optional[Dict[str, Any]] = None,
    unsubscribed: bool = False,
    segment_ids: Optional[List[str]] = None,
) -> Optional[Dict[str, Any]]:
    email = _normalize_email(email)
    if not email:
        return None

    if _is_disabled_mode():
        logger.info("Resend contact sync skipped because EMAIL_AUTOMATION_MODE=disabled", extra={"email": _mask_email(email)})
        return None
    if _is_test_mode() and not _is_allowlisted_email(email):
        logger.info("Resend contact sync skipped because email is not allowlisted for test mode", extra={"email": _mask_email(email)})
        return None

    _resend_client()
    payload: Dict[str, Any] = {
        "email": email,
        "first_name": first_name or None,
        "last_name": last_name or None,
        "unsubscribed": bool(unsubscribed),
        "properties": properties or {},
    }

    try:
        existing = await _get_resend_contact_by_email(email)
        if existing and existing.get("id"):
            update_params = resend.Contacts.UpdateParams(
                id=existing["id"],
                email=email,
                first_name=first_name,
                last_name=last_name,
                unsubscribed=unsubscribed,
                properties=properties or {},
            )
            result = await resend.Contacts.update_async(update_params)
        else:
            create_params = resend.Contacts.CreateParams(
                email=email,
                first_name=first_name,
                last_name=last_name,
                unsubscribed=unsubscribed,
                properties=properties or {},
            )
            result = await resend.Contacts.create_async(create_params)

        logger.info("Resend contact synced", extra={"email": _mask_email(email), "contact_id": getattr(result, 'id', None)})

        if segment_ids:
            for segment_id in segment_ids:
                if segment_id:
                    await add_contact_to_segment(email=email, segment_id=segment_id)

        return result.__dict__ if hasattr(result, "__dict__") else None
    except Exception as exc:
        logger.error("Failed to sync Resend contact", exc_info=True, extra={"email": _mask_email(email), "error": str(exc)})
        return None


async def add_contact_to_segment(email: Optional[str] = None, contact_id: Optional[str] = None, segment_id: str = "") -> bool:
    if not segment_id:
        return False
    if not email and not contact_id:
        return False
    if _is_disabled_mode():
        return False
    if _is_test_mode() and email and not _is_allowlisted_email(email):
        return False

    _resend_client()
    try:
        params = resend.Contacts.Segments.AddParams(
            segment_id=segment_id,
            email=email,
            contact_id=contact_id,
        )
        await resend.Contacts.Segments.add_async(params)
        logger.info("Added contact to segment", extra={"segment_id": segment_id, "email": _mask_email(email), "contact_id": contact_id})
        return True
    except Exception as exc:
        logger.warning("Failed to add contact to Resend segment", exc_info=True, extra={"segment_id": segment_id, "email": _mask_email(email), "error": str(exc)})
        return False


async def remove_contact_from_segment(email: Optional[str] = None, contact_id: Optional[str] = None, segment_id: str = "") -> bool:
    if not segment_id:
        return False
    if not email and not contact_id:
        return False
    if _is_disabled_mode():
        return False
    if _is_test_mode() and email and not _is_allowlisted_email(email):
        return False

    _resend_client()
    try:
        params = resend.Contacts.Segments.RemoveParams(
            segment_id=segment_id,
            email=email,
            contact_id=contact_id,
        )
        await resend.Contacts.Segments.remove_async(params)
        logger.info("Removed contact from segment", extra={"segment_id": segment_id, "email": _mask_email(email), "contact_id": contact_id})
        return True
    except Exception as exc:
        logger.warning("Failed to remove contact from Resend segment", exc_info=True, extra={"segment_id": segment_id, "email": _mask_email(email), "error": str(exc)})
        return False
