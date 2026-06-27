"""
Admin Dashboard Backend Tests
Tests admin auth, dashboard stats, orders, customers, inventory, coupons.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    BASE_URL = "https://axis-creator.preview.emergentagent.com"

ADMIN_EMAIL = "admin@capeember.co.za"
ADMIN_PASSWORD = "CapeEmber2024!"
USER_EMAIL = "testuser2@capeember.co.za"
USER_PASSWORD = "Test1234!"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=30,
    )
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json()
    is_admin = data.get("is_admin") or data.get("user", {}).get("is_admin")
    assert is_admin is True, f"is_admin flag missing/false: {data}"
    assert "access_token" in data or "token" in data
    return data.get("access_token") or data.get("token")


@pytest.fixture(scope="session")
def user_token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": USER_EMAIL, "password": USER_PASSWORD},
        timeout=30,
    )
    if r.status_code != 200:
        pytest.skip(f"test user login failed: {r.status_code}")
    return r.json().get("access_token") or r.json().get("token")


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture
def user_headers(user_token):
    return {"Authorization": f"Bearer {user_token}", "Content-Type": "application/json"}


# ---------- Auth ----------
class TestAdminAuth:
    def test_admin_login_returns_is_admin_true(self):
        r = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=30,
        )
        assert r.status_code == 200
        data = r.json()
        # is_admin may be top-level or nested under user
        is_admin = data.get("is_admin") or data.get("user", {}).get("is_admin")
        assert is_admin is True, f"is_admin not True: {data}"
        assert data.get("user", {}).get("email") == ADMIN_EMAIL or data.get("email") == ADMIN_EMAIL

    def test_auth_me_returns_is_admin(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=admin_headers, timeout=30)
        assert r.status_code == 200
        assert r.json().get("is_admin") is True

    def test_non_admin_forbidden(self, user_headers):
        r = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=user_headers, timeout=30)
        assert r.status_code in (401, 403)

    def test_unauthenticated_forbidden(self):
        r = requests.get(f"{BASE_URL}/api/admin/dashboard", timeout=30)
        assert r.status_code in (401, 403)


# ---------- Dashboard ----------
class TestAdminDashboard:
    def test_dashboard_returns_stats(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=admin_headers, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        # Validate key sections exist
        # Expected: revenue stats, recent orders, top products
        keys = set(data.keys())
        # be tolerant about naming
        assert any(k in keys for k in ("total_revenue", "revenue", "stats", "summary", "overview")), f"missing revenue stats: {keys}"
        assert any(k in keys for k in ("recent_orders", "orders", "latest_orders")), f"missing recent_orders: {keys}"
        assert any(k in keys for k in ("top_products", "best_sellers", "top_selling")), f"missing top_products: {keys}"


# ---------- Orders ----------
class TestAdminOrders:
    def test_list_orders(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/orders", headers=admin_headers, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        # should support list or paginated dict
        assert isinstance(data, (list, dict))
        orders = data if isinstance(data, list) else data.get("orders") or data.get("items") or data.get("data") or []
        assert isinstance(orders, list)

    def test_list_orders_filter_by_status(self, admin_headers):
        r = requests.get(
            f"{BASE_URL}/api/admin/orders?status=pending",
            headers=admin_headers,
            timeout=30,
        )
        assert r.status_code == 200

    def test_list_orders_pagination(self, admin_headers):
        r = requests.get(
            f"{BASE_URL}/api/admin/orders?page=1&limit=10",
            headers=admin_headers,
            timeout=30,
        )
        assert r.status_code == 200


# ---------- Customers ----------
class TestAdminCustomers:
    def test_list_customers(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/customers", headers=admin_headers, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        customers = data if isinstance(data, list) else data.get("customers") or data.get("items") or data.get("data") or []
        assert isinstance(customers, list)

    def test_search_customers(self, admin_headers):
        r = requests.get(
            f"{BASE_URL}/api/admin/customers?search=testuser",
            headers=admin_headers,
            timeout=30,
        )
        assert r.status_code == 200


# ---------- Inventory ----------
class TestAdminInventory:
    def test_list_inventory(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/inventory", headers=admin_headers, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        items = data if isinstance(data, list) else data.get("inventory") or data.get("products") or data.get("items") or []
        assert isinstance(items, list)
        # At least 1 product seeded
        assert len(items) > 0, "no products in inventory"


# ---------- Coupons ----------
class TestAdminCoupons:
    def test_list_coupons(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/coupons", headers=admin_headers, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        coupons = data if isinstance(data, list) else data.get("coupons") or data.get("items") or []
        assert isinstance(coupons, list)

    def test_create_and_delete_coupon(self, admin_headers):
        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc)
        payload = {
            "code": "TEST_ADMIN_PYT",
            "discount_type": "percentage",
            "discount_value": 5,
            "minimum_order": 50,
            "description": "TEST coupon from pytest",
            "is_active": True,
            "valid_from": now.isoformat(),
            "valid_until": (now + timedelta(days=30)).isoformat(),
        }
        r = requests.post(
            f"{BASE_URL}/api/admin/coupons", json=payload, headers=admin_headers, timeout=30
        )
        # may return 200 or 201
        assert r.status_code in (200, 201), f"create coupon failed: {r.status_code} {r.text}"

        # Verify via list
        r2 = requests.get(f"{BASE_URL}/api/admin/coupons", headers=admin_headers, timeout=30)
        assert r2.status_code == 200
        data = r2.json()
        coupons = data if isinstance(data, list) else data.get("coupons") or data.get("items") or []
        codes = [c.get("code") for c in coupons]
        assert "TEST_ADMIN_PYT" in codes, f"created coupon not found: {codes}"

        # Cleanup
        r3 = requests.delete(
            f"{BASE_URL}/api/admin/coupons/TEST_ADMIN_PYT", headers=admin_headers, timeout=30
        )
        assert r3.status_code in (200, 204)


# ---------- Content / copywriting checks (backend product data) ----------
class TestProductContent:
    def test_product_origins_are_south_african(self):
        r = requests.get(f"{BASE_URL}/api/products", timeout=30)
        assert r.status_code == 200
        body = r.json()
        products = body if isinstance(body, list) else body.get("products") or body.get("items") or body.get("data") or []
        assert isinstance(products, list) and len(products) > 0
        forbidden = ["Brazil", "Colombia", "Ethiopia"]
        for p in products:
            origin = (p.get("origin") or "")
            for f in forbidden:
                assert f not in origin, f"product {p.get('name')} still has origin '{origin}'"
