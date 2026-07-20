"""
Internal lifecycle tests for Cape Ember Coffee backend.
These tests verify backend contact and subscription request routes using TestClient.
"""
import sys
import pytest
from starlette.testclient import TestClient

ROOT_DIR = __import__("os").path.dirname(__import__("os").path.dirname(__import__("os").path.abspath(__file__)))
sys.path.insert(0, ROOT_DIR)

import server
import resend_events

TEST_EMAIL = "info@capeembercoffee.co.za"
TEST_NAME = "Cape Ember QA"


class TestEmailLifecycle:
    def test_contact_form_route_responds_successfully(self, monkeypatch):
        class DummyCollection:
            def __init__(self):
                self.inserted = None

            async def insert_one(self, document):
                self.inserted = document
                return None

        async def fake_send_resend_email(to_email, subject, html):
            return True

        dummy_db = type("DummyDB", (), {"contact_submissions": DummyCollection()})()
        monkeypatch.setattr(server, "db", dummy_db)
        monkeypatch.setattr(server, "send_resend_email", fake_send_resend_email)

        client = TestClient(server.app)
        response = client.post(
            "/api/contact",
            json={
                "name": TEST_NAME,
                "email": TEST_EMAIL,
                "subject": "Automated Email Lifecycle Test",
                "message": "This is a lifecycle test to verify contact form email behavior.",
                "website": ""
            },
            timeout=30,
        )

        assert response.status_code == 200, response.text
        result = response.json()
        assert "message" in result
        assert "received" in result["message"].lower() or "thanks" in result["message"].lower()
        assert dummy_db.contact_submissions.inserted is not None
        assert dummy_db.contact_submissions.inserted["email"] == TEST_EMAIL

    def test_subscription_request_route_responds_successfully(self, monkeypatch):
        class DummyCollection:
            def __init__(self):
                self.inserted = None

            async def insert_one(self, document):
                self.inserted = document
                return None

        async def fake_send_subscription_request_emails(subscription):
            return True

        async def fake_sync_resend_contact(email, first_name, last_name, properties=None, unsubscribed=False, segment_ids=None):
            return None

        dummy_db = type("DummyDB", (), {"subscriptions": DummyCollection()})()
        monkeypatch.setattr(server, "db", dummy_db)
        monkeypatch.setattr(server, "send_subscription_request_emails", fake_send_subscription_request_emails)
        monkeypatch.setattr(resend_events, "sync_resend_contact", fake_sync_resend_contact)

        client = TestClient(server.app)
        response = client.post(
            "/api/subscriptions/request",
            json={
                "plan_name": "Ember Circle",
                "blend": "Fynbos Roast",
                "grind": "Whole Bean",
                "frequency": "Monthly",
                "quantity": 1,
                "delivery_address": {
                    "first_name": TEST_NAME,
                    "last_name": "Automation",
                    "street": "123 Test Lane",
                    "city": "Cape Town",
                    "province": "Western Cape",
                    "postal_code": "8001",
                    "country": "South Africa",
                    "phone": "+27831234567"
                },
                "preferred_delivery_day": "Monday",
                "delivery_notes": "Automation lifecycle test",
                "customer_email": TEST_EMAIL,
                "customer_name": TEST_NAME
            },
            timeout=30,
        )

        assert response.status_code == 200, response.text
        data = response.json()
        assert data.get("message") and "submitted" in data["message"].lower()
        assert data.get("id"), "Subscription request response missing id"
        assert dummy_db.subscriptions.inserted is not None
        assert dummy_db.subscriptions.inserted["customer_email"] == TEST_EMAIL
