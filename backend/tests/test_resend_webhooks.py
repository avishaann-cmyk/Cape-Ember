"""
Resend webhook verification tests for the Cape Ember backend.
"""
import asyncio
import base64
import json
import os
import sys
import time
import uuid

import pytest
from starlette.testclient import TestClient

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT_DIR)

import server
import resend_events


def build_svix_headers(payload: str, secret_bytes: bytes, event_id: str = None):
    event_id = event_id or str(uuid.uuid4())
    timestamp = str(int(time.time()))
    encoded_secret = base64.b64encode(secret_bytes).decode("utf-8")
    signature = base64.b64encode(
        __import__("hmac").new(secret_bytes, f"{event_id}.{timestamp}.{payload}".encode("utf-8"), __import__("hashlib").sha256).digest()
    ).decode("utf-8")
    signed_header = f"v1,{signature}"

    return {
        "svix-id": event_id,
        "svix-timestamp": timestamp,
        "svix-signature": signed_header,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }, f"whsec_{encoded_secret}"


def test_verify_resend_webhook_helper_valid_signature():
    payload_obj = {"event": "contact.created", "id": str(uuid.uuid4()), "data": {"email": "info@capeembercoffee.co.za"}}
    payload = json.dumps(payload_obj, separators=(",", ":"))
    secret_bytes = b"test-resend-webhook-secret-1234567890"
    headers, secret_value = build_svix_headers(payload, secret_bytes, event_id=payload_obj["id"])

    class FakeRequest:
        def __init__(self, headers):
            self.headers = headers

    fake_request = FakeRequest(headers)
    resend_events.RESEND_WEBHOOK_SECRET = secret_value

    verified = asyncio.run(resend_events.verify_resend_webhook(fake_request, payload.encode("utf-8")))

    assert verified["event"] == payload_obj["event"]
    assert verified["id"] == payload_obj["id"]
    assert verified["data"]["email"] == "info@capeembercoffee.co.za"


def test_resend_webhook_route_inserts_event(monkeypatch):
    payload_obj = {"event": "contact.created", "id": str(uuid.uuid4()), "data": {"email": "info@capeembercoffee.co.za"}}
    payload = json.dumps(payload_obj, separators=(",", ":"))
    secret_bytes = b"test-resend-webhook-secret-1234567890"
    headers, secret_value = build_svix_headers(payload, secret_bytes, event_id=payload_obj["id"])

    # Apply the same secret to the module under test
    resend_events.RESEND_WEBHOOK_SECRET = secret_value

    class DummyCollection:
        def __init__(self):
            self.inserted = None

        async def insert_one(self, document):
            self.inserted = document
            return None

    dummy_db = type("DummyDB", (), {"resend_webhook_events": DummyCollection()})()
    monkeypatch.setattr(server, "db", dummy_db)

    client = TestClient(server.app)
    response = client.post(
        "/api/webhooks/resend",
        data=payload,
        headers=headers,
        timeout=30,
    )

    assert response.status_code == 200, response.text
    assert dummy_db.resend_webhook_events.inserted is not None, "Expected insert_one to be called"
    assert dummy_db.resend_webhook_events.inserted["id"] == payload_obj["id"]
    assert dummy_db.resend_webhook_events.inserted["event"] == payload_obj["event"]
    assert dummy_db.resend_webhook_events.inserted["payload"]["data"]["email"] == "info@capeembercoffee.co.za"
