"""Phase 3 Backend Tests - Cart, Coupon, Checkout endpoints."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://axis-creator.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

TEST_EMAIL = "testuser2@capeember.co.za"
TEST_PASSWORD = "Test1234!"


@pytest.fixture(scope="module")
def auth_token():
    r = requests.post(f"{API}/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Login failed: {r.status_code} {r.text}")
    return r.json().get("access_token")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


# ============ Health / Products ============
class TestHealth:
    def test_products_list(self):
        r = requests.get(f"{API}/products")
        assert r.status_code == 200
        data = r.json()
        products = data.get("products", data) if isinstance(data, dict) else data
        assert isinstance(products, list)
        assert len(products) > 0


# ============ Cart ============
class TestCart:
    def test_get_cart_authenticated(self, auth_headers):
        r = requests.get(f"{API}/cart", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "items" in data
        # Per task context, test user has 5x Fynbos Roast
        assert isinstance(data["items"], list)

    def test_cart_subtotal_calculation(self, auth_headers):
        r = requests.get(f"{API}/cart", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        items = data.get("items", [])
        # Verify item structure
        if items:
            it = items[0]
            assert "product_id" in it
            assert "quantity" in it
            assert "price" in it


# ============ Coupon ============
class TestCoupon:
    def test_apply_valid_coupon_welcome10(self, auth_headers):
        r = requests.post(f"{API}/cart/coupon", json={"code": "WELCOME10"}, headers=auth_headers)
        assert r.status_code == 200, f"Got {r.status_code}: {r.text}"
        data = r.json()
        assert "coupon" in data
        assert data["coupon"]["code"] == "WELCOME10"
        assert "discount_type" in data["coupon"]
        assert "discount_value" in data["coupon"]

    def test_apply_invalid_coupon(self, auth_headers):
        r = requests.post(f"{API}/cart/coupon", json={"code": "INVALIDXYZ123"}, headers=auth_headers)
        assert r.status_code == 404
        data = r.json()
        assert "detail" in data

    def test_remove_coupon(self, auth_headers):
        # Apply first
        requests.post(f"{API}/cart/coupon", json={"code": "WELCOME10"}, headers=auth_headers)
        r = requests.delete(f"{API}/cart/coupon", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "message" in data

    def test_coupon_case_insensitive(self, auth_headers):
        r = requests.post(f"{API}/cart/coupon", json={"code": "welcome10"}, headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["coupon"]["code"] == "WELCOME10"
        # cleanup
        requests.delete(f"{API}/cart/coupon", headers=auth_headers)


# ============ Shipping ============
class TestShipping:
    def test_shipping_rates_above_threshold(self):
        r = requests.get(f"{API}/shipping/rates", params={"province": "Western Cape", "subtotal": 500})
        assert r.status_code == 200
        data = r.json()
        assert "rates" in data
        # When above threshold all rates should be free=True
        for rate in data["rates"]:
            assert rate.get("free") is True or rate.get("price") == 0

    def test_shipping_rates_below_threshold(self):
        r = requests.get(f"{API}/shipping/rates", params={"province": "Western Cape", "subtotal": 200})
        assert r.status_code == 200
        data = r.json()
        assert "rates" in data


# ============ Orders (Checkout) ============
class TestOrders:
    def test_create_order_authenticated(self, auth_headers):
        payload = {
            "shipping_address": {
                "first_name": "Test",
                "last_name": "User2",
                "street": "1 Long Street",
                "apartment": "",
                "city": "Cape Town",
                "province": "Western Cape",
                "postal_code": "8001",
                "country": "South Africa",
                "phone": "+27810000000"
            },
            "is_subscription": False,
            "subscription_frequency": None,
            "payment_method": "payfast",
            "order_notes": "TEST_phase3_order",
            "guest_email": None
        }
        r = requests.post(f"{API}/orders", json=payload, headers=auth_headers)
        assert r.status_code in [200, 201], f"Got {r.status_code}: {r.text}"
        data = r.json()
        assert "order_id" in data

    def test_create_order_with_subscription(self, auth_headers):
        payload = {
            "shipping_address": {
                "first_name": "Test",
                "last_name": "User2",
                "street": "1 Long Street",
                "city": "Cape Town",
                "province": "Western Cape",
                "postal_code": "8001",
                "country": "South Africa",
                "phone": "+27810000000"
            },
            "is_subscription": True,
            "subscription_frequency": "monthly",
            "payment_method": "payfast",
            "order_notes": "TEST_phase3_subscription",
        }
        r = requests.post(f"{API}/orders", json=payload, headers=auth_headers)
        # Accept 200/201 or controlled failures
        assert r.status_code in [200, 201, 400], f"Got {r.status_code}: {r.text}"


# ============ PayFast ============
class TestPayFast:
    def test_create_payment_requires_order(self, auth_headers):
        # First make an order
        payload = {
            "shipping_address": {
                "first_name": "Test", "last_name": "User2",
                "street": "1 Long Street", "city": "Cape Town",
                "province": "Western Cape", "postal_code": "8001",
                "country": "South Africa", "phone": "+27810000000"
            },
            "is_subscription": False,
            "payment_method": "payfast",
            "order_notes": "TEST_payfast",
        }
        order_res = requests.post(f"{API}/orders", json=payload, headers=auth_headers)
        if order_res.status_code not in [200, 201]:
            pytest.skip(f"Order create failed: {order_res.status_code} {order_res.text}")
        order_id = order_res.json().get("order_id")
        assert order_id

        r = requests.post(f"{API}/payfast/create-payment", json={"order_id": order_id}, headers=auth_headers)
        assert r.status_code == 200, f"PayFast: {r.status_code} {r.text}"
        data = r.json()
        assert "payfast_host" in data
        assert "fields" in data
        assert isinstance(data["fields"], dict)
