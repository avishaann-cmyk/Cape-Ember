# Tests for P2: SEO endpoints (sitemap, robots) and Email helpers wiring
import os
import re
import requests
import pytest

PUBLIC_BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://axis-creator.preview.emergentagent.com").rstrip("/")
LOCAL_BASE = "http://localhost:8001"


# ---------- SEO endpoints via PUBLIC URL (what crawlers will actually see) ----------
class TestSEOPublic:
    """These hit the public ingress – the URL Google/Bing will crawl."""

    def test_sitemap_public_returns_xml(self):
        r = requests.get(f"{PUBLIC_BASE}/sitemap.xml", timeout=20)
        assert r.status_code == 200, r.status_code
        ctype = r.headers.get("content-type", "")
        assert "xml" in ctype.lower(), f"Expected XML content-type, got {ctype}. Body starts with: {r.text[:120]!r}"
        assert r.text.lstrip().startswith("<?xml"), f"Body is not XML: {r.text[:200]!r}"
        assert "<urlset" in r.text
        assert "/shop" in r.text

    def test_robots_public_returns_backend_content(self):
        r = requests.get(f"{PUBLIC_BASE}/robots.txt", timeout=20)
        assert r.status_code == 200
        # Backend robots should contain our custom disallow lines
        assert "Disallow: /admin/" in r.text, f"Backend robots.txt not served via public URL. Body starts: {r.text[:200]!r}"
        assert "Sitemap:" in r.text


# ---------- SEO endpoints via LOCAL backend (verifies the FastAPI route itself is correct) ----------
class TestSEOLocalBackend:
    def test_sitemap_local(self):
        r = requests.get(f"{LOCAL_BASE}/sitemap.xml", timeout=10)
        assert r.status_code == 200
        assert "application/xml" in r.headers.get("content-type", "")
        assert r.text.startswith("<?xml")
        # Must contain product URLs
        assert "/products/" in r.text
        # Must list core pages
        for path in ["/shop", "/about", "/subscriptions", "/brew-guide"]:
            assert f"{path}<" in r.text or f"{path}</loc" in r.text, f"sitemap missing {path}"
        # Validate it's well-formed XML
        import xml.etree.ElementTree as ET
        root = ET.fromstring(r.text)
        ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        urls = root.findall("s:url", ns)
        assert len(urls) >= 5  # home, shop, about, subscriptions, brew-guide + products

    def test_robots_local(self):
        r = requests.get(f"{LOCAL_BASE}/robots.txt", timeout=10)
        assert r.status_code == 200
        assert "text/plain" in r.headers.get("content-type", "")
        for token in ["User-agent: *", "Allow: /", "Disallow: /admin/", "Disallow: /api/", "Disallow: /cdn", "Sitemap:"]:
            assert token in r.text, f"robots.txt missing token: {token!r}"


# ---------- Regression: cart update / delete (from iteration_8) ----------
@pytest.fixture(scope="module")
def auth_token():
    r = requests.post(f"{PUBLIC_BASE}/api/auth/login",
                      json={"email": "testuser2@capeember.co.za", "password": "Test1234!"},
                      timeout=20)
    if r.status_code != 200:
        pytest.skip(f"login failed {r.status_code}: {r.text[:120]}")
    j = r.json()
    return j.get("access_token") or j.get("token")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


class TestCartRegression:
    def test_clear_then_add(self, auth_headers):
        requests.delete(f"{PUBLIC_BASE}/api/cart", headers=auth_headers, timeout=15)
        # Find a product
        prods = requests.get(f"{PUBLIC_BASE}/api/products", timeout=15).json()
        plist = prods.get("products", prods) if isinstance(prods, dict) else prods
        assert isinstance(plist, list) and len(plist) > 0
        p = next((x for x in plist if x.get("variants")), plist[0])
        variant_id = (p.get("variants") or [{}])[0].get("id") or "default"
        r = requests.post(f"{PUBLIC_BASE}/api/cart/add", headers=auth_headers,
                          json={"product_id": p["id"], "variant_id": variant_id, "quantity": 1}, timeout=15)
        assert r.status_code in (200, 201), r.text

    def test_update_quantity(self, auth_headers):
        cart = requests.get(f"{PUBLIC_BASE}/api/cart", headers=auth_headers, timeout=15).json()
        items = cart.get("items", [])
        assert items, "cart empty"
        item_id = items[0]["id"]
        r = requests.put(f"{PUBLIC_BASE}/api/cart/items/{item_id}", headers=auth_headers,
                         json={"quantity": 3}, timeout=15)
        assert r.status_code == 200, r.text
        cart2 = requests.get(f"{PUBLIC_BASE}/api/cart", headers=auth_headers, timeout=15).json()
        updated = next((i for i in cart2["items"] if i["id"] == item_id), None)
        assert updated and updated["quantity"] == 3

    def test_delete_item(self, auth_headers):
        cart = requests.get(f"{PUBLIC_BASE}/api/cart", headers=auth_headers, timeout=15).json()
        items = cart.get("items", [])
        assert items, "cart empty"
        item_id = items[0]["id"]
        r = requests.delete(f"{PUBLIC_BASE}/api/cart/items/{item_id}", headers=auth_headers, timeout=15)
        assert r.status_code in (200, 204), r.text
        cart2 = requests.get(f"{PUBLIC_BASE}/api/cart", headers=auth_headers, timeout=15).json()
        assert all(i["id"] != item_id for i in cart2.get("items", []))
