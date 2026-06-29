"""
Cart Bug Fix Regression Tests
Tests: PUT /api/cart/items/{item_id}, DELETE /api/cart/items/{item_id},
       POST /api/cart/coupon, DELETE /api/cart/coupon
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

TEST_EMAIL = "testuser2@capeember.co.za"
TEST_PASSWORD = "Test1234!"


@pytest.fixture(scope="module")
def auth_headers():
    r = requests.post(f"{API}/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"login failed {r.status_code} {r.text}"
    token = r.json().get("token") or r.json().get("access_token")
    assert token, f"no token in {r.json()}"
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def product():
    r = requests.get(f"{API}/products", timeout=15)
    assert r.status_code == 200
    body = r.json()
    products = body.get("products", body) if isinstance(body, dict) else body
    # Pick first product with a variant in stock
    for p in products:
        if p.get("is_bundle"):
            continue
        for v in p.get("variants", []):
            if v.get("stock_quantity", 0) > 5:
                return {"product_id": p["id"], "variant_id": v["id"], "price": v["price"], "name": p["name"]}
    pytest.skip("no in-stock product variant available")


@pytest.fixture(autouse=True)
def _clean_cart(auth_headers):
    # Clear cart before each test
    requests.delete(f"{API}/cart", headers=auth_headers, timeout=15)
    requests.delete(f"{API}/cart/coupon", headers=auth_headers, timeout=15)
    yield
    requests.delete(f"{API}/cart", headers=auth_headers, timeout=15)
    requests.delete(f"{API}/cart/coupon", headers=auth_headers, timeout=15)


# ---------- Cart Update / Delete ----------

class TestCartUpdateDelete:
    def _add(self, auth_headers, product, qty=1):
        r = requests.post(
            f"{API}/cart/add",
            json={"product_id": product["product_id"], "variant_id": product["variant_id"], "quantity": qty},
            headers=auth_headers, timeout=15,
        )
        assert r.status_code == 200, r.text

    def test_update_quantity_increase(self, auth_headers, product):
        self._add(auth_headers, product, qty=1)
        item_id = f"{product['product_id']}_{product['variant_id']}"
        r = requests.put(f"{API}/cart/items/{item_id}", json={"quantity": 3}, headers=auth_headers, timeout=15)
        assert r.status_code == 200, r.text

        cart = requests.get(f"{API}/cart", headers=auth_headers, timeout=15).json()
        items = cart.get("items", [])
        assert len(items) == 1
        assert items[0]["quantity"] == 3

    def test_update_quantity_decrease(self, auth_headers, product):
        self._add(auth_headers, product, qty=3)
        item_id = f"{product['product_id']}_{product['variant_id']}"
        r = requests.put(f"{API}/cart/items/{item_id}", json={"quantity": 1}, headers=auth_headers, timeout=15)
        assert r.status_code == 200
        cart = requests.get(f"{API}/cart", headers=auth_headers, timeout=15).json()
        assert cart["items"][0]["quantity"] == 1

    def test_update_quantity_to_zero_removes_item(self, auth_headers, product):
        self._add(auth_headers, product, qty=2)
        item_id = f"{product['product_id']}_{product['variant_id']}"
        r = requests.put(f"{API}/cart/items/{item_id}", json={"quantity": 0}, headers=auth_headers, timeout=15)
        assert r.status_code == 200
        cart = requests.get(f"{API}/cart", headers=auth_headers, timeout=15).json()
        assert len(cart.get("items", [])) == 0

    def test_delete_item(self, auth_headers, product):
        self._add(auth_headers, product, qty=2)
        item_id = f"{product['product_id']}_{product['variant_id']}"
        r = requests.delete(f"{API}/cart/items/{item_id}", headers=auth_headers, timeout=15)
        assert r.status_code == 200, r.text
        cart = requests.get(f"{API}/cart", headers=auth_headers, timeout=15).json()
        assert len(cart.get("items", [])) == 0

    def test_cart_total_updates(self, auth_headers, product):
        self._add(auth_headers, product, qty=1)
        cart1 = requests.get(f"{API}/cart", headers=auth_headers, timeout=15).json()
        sub1 = cart1["subtotal"]
        item_id = f"{product['product_id']}_{product['variant_id']}"
        requests.put(f"{API}/cart/items/{item_id}", json={"quantity": 3}, headers=auth_headers, timeout=15)
        cart2 = requests.get(f"{API}/cart", headers=auth_headers, timeout=15).json()
        assert cart2["subtotal"] == pytest.approx(sub1 * 3, rel=0.01)


# ---------- Coupon Apply / Remove ----------

class TestCoupon:
    def _seed_cart(self, auth_headers, product):
        # Make sure subtotal >= R100
        qty = max(1, int(120 / max(1, product["price"])) + 1)
        r = requests.post(
            f"{API}/cart/add",
            json={"product_id": product["product_id"], "variant_id": product["variant_id"], "quantity": qty},
            headers=auth_headers, timeout=15,
        )
        assert r.status_code == 200, r.text

    def test_apply_welcome10(self, auth_headers, product):
        self._seed_cart(auth_headers, product)
        r = requests.post(f"{API}/cart/coupon", json={"code": "WELCOME10"}, headers=auth_headers, timeout=15)
        assert r.status_code == 200, f"apply coupon failed: {r.status_code} {r.text}"
        body = r.json()
        assert body.get("coupon", {}).get("code") == "WELCOME10"
        cart = requests.get(f"{API}/cart", headers=auth_headers, timeout=15).json()
        assert cart.get("coupon_code") == "WELCOME10"
        assert cart.get("discount", 0) > 0

    def test_remove_coupon(self, auth_headers, product):
        self._seed_cart(auth_headers, product)
        requests.post(f"{API}/cart/coupon", json={"code": "WELCOME10"}, headers=auth_headers, timeout=15)
        r = requests.delete(f"{API}/cart/coupon", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        cart = requests.get(f"{API}/cart", headers=auth_headers, timeout=15).json()
        assert not cart.get("coupon_code")
        assert cart.get("discount", 0) == 0
