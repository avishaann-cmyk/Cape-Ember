# Cape Ember Payment & Checkout Audit
**Date:** 2026-07-20  
**Branch:** cape-ember-payments-checkout-audit

---

## 1. Architecture Overview

| Layer | Technology |
|---|---|
| Frontend | React 18, Tailwind CSS, Framer Motion, Phosphor Icons |
| Backend | FastAPI (Python), served via Uvicorn on port 8001 |
| Database | MongoDB (local, cape_ember_coffee) |
| Payments | PayFast (custom integration), Stitch (partial integration) |
| Email | Resend API |
| Hosting | Emergent platform |

---

## 2. Payment Flow (PayFast)

```
Customer → Cart → Checkout form (React)
  → POST /api/checkout (FastAPI)
    → Server validates cart, recalculates totals
    → Creates Order doc (status: pending_payment)
    → Builds PayFast form fields + signature
    → Returns fields to browser
  → Browser POSTs form to www.payfast.co.za/eng/process
    → Customer pays on PayFast-hosted page
    → PayFast sends ITN (webhook) to /api/webhooks/payfast
      → Server verifies ITN signature + amount
      → Sets Order status → paid
      → Sends confirmation email
    → PayFast redirects customer to /payment/success?order_id=...
      → Return page shows success message
```

---

## 3. Root Causes of PayFast 400 "Signature Does Not Match"

### BUG 1 — `merchant_key` removed from form (CRITICAL)
PayFast **requires** `merchant_key` as a form field AND it must be included in the signature calculation string. It was incorrectly removed in a prior fix attempt. This causes PayFast to receive a signature that was computed without `merchant_key`, while PayFast always includes it in their own recalculation → mismatch.

### BUG 2 — `m_payment_id` changed from UUID to `order_number` (CRITICAL)
The ITN webhook handler does:
```python
order_id = data.get("m_payment_id")      # now "CE-20260720-BEB0"
order = await db.orders.find_one({"_id": order_id})  # but _id is a UUID!
```
After this change, all ITN processing silently fails — orders never transition to `paid`.

### BUG 3 — Signature field ordering
`generate_payfast_signature` sorts fields alphabetically via `sorted()`. PayFast also sorts alphabetically, so this is consistent — but only if **the same set of fields** is sorted. Any extra or missing field changes the sort-derived string and breaks the hash.

### Summary matrix

| Issue | Effect | Fix |
|---|---|---|
| `merchant_key` missing | 400 signature mismatch | Restore to form data |
| `m_payment_id` = order_number | ITN lookup fails silently | Revert to order UUID |
| Debug logs were verbose | Secrets in logs | Keep `PAYFAST_DEBUG=false` in prod |

---

## 4. Merchant Credential Configuration

| Variable | Value source | Notes |
|---|---|---|
| `PAYFAST_MERCHANT_ID` | backend/.env | 34064005 (LIVE) |
| `PAYFAST_MERCHANT_KEY` | backend/.env | nfvifv037umoe (LIVE) |
| `PAYFAST_PASSPHRASE` | backend/.env | Taegan123456 (LIVE) |
| `PAYFAST_SANDBOX` | backend/.env | false (LIVE) |

---

## 5. URL Configuration

| URL | Current value | Notes |
|---|---|---|
| return_url | `{FRONTEND_URL}/payment/success?order_id={order_id}` | Correct |
| cancel_url | `{FRONTEND_URL}/payment/cancel?order_id={order_id}` | Correct |
| notify_url | `{BACKEND_URL}/api/webhooks/payfast` | BACKEND_URL must be publicly reachable |

`BACKEND_URL` is read from env var `REACT_APP_BACKEND_URL`. If not set, falls back to `https://capeembercoffee.co.za`.

---

## 6. Signature Generation Method

**Location:** `backend/server.py` → `generate_payfast_signature()`

```python
# Fields sorted alphabetically
# URL-encoded with quote_plus (+ for spaces)
# Passphrase appended at end if set
# MD5 hash of full string
```

PayFast expects exactly this algorithm. The bug is that `merchant_key` was removed from the input `data` dict before this function was called.

---

## 7. ITN Verification Method

**Location:** `backend/server.py` → `verify_payfast_itn()`

- Reads form body
- Pops `signature` from data
- Recalculates expected signature
- Compares signatures
- Validates source IP (skipped in sandbox mode)

**Note:** Starlette caches `request.form()` after first call, so the webhook handler reading it a second time is safe.

---

## 8. Order State Transitions

```
draft (not used)
pending_payment → PAYFAST redirects customer
paid            ← set by ITN COMPLETE
payment_failed  ← set by ITN FAILED/CANCELLED
cancelled
```

Current database snapshot: 11 orders, all stuck at `pending` or `pending_payment` with `payment_status: pending`. No orders have been paid. This confirms ITN processing has never succeeded.

---

## 9. VAT Calculation

- All retail prices are VAT-inclusive (South African standard).
- `calculate_vat(amount)` extracts the VAT portion: `amount * 0.15 / 1.15`
- `calculate_cart_totals()` returns subtotal (inclusive), discount, shipping, vat (extracted), total.
- Frontend `cartTotals.js` mirrors this correctly.
- **Issue:** Checkout page shows a "VAT Included in Total" row but the label is slightly misleading. The total does NOT increase due to VAT — it is extracted from the price, not added.

---

## 10. Shipping Calculation

**Backend:** `calculate_shipping()` in server.py  
**Frontend:** `resolveShippingCost()` in cartTotals.js  

Priority:
1. Collection → free
2. Subscription → free
3. Sedgefield destination → free (uses `is_sedgefield_destination()`)
4. Subtotal ≥ threshold → free
5. Zone rate from `SHIPPING_ZONES` dict

Sedgefield detection uses `re.search(r"\bsedgefield\b", text.lower())` — correct word-boundary match.

---

## 11. Product Image Mappings

Products are served from in-memory `PRODUCTS_MAP` (not MongoDB `products` collection):

| Product | Image path |
|---|---|
| Fynbos Roast | /assets/cape-ember/cape-ember-fynbos-lifestyle.jpeg |
| Garden Route Blend | /assets/cape-ember/cape-ember-garden-route-lifestyle.jpeg |
| Ember Reserve | /assets/cape-ember/cape-ember-ember-reserve-lifestyle.jpeg |
| Karoo Horizon | /assets/cape-ember/cape-ember-karoo-horizon-lifestyle.jpeg |
| Landscape Bundle | /assets/cape-ember/cape-ember-landscape-bundle-banner.jpeg |

Cart items receive `image_url` from the product record. Frontend falls back to `/placeholder-coffee.jpg` if blank.

---

## 12. Duplicated Components

- No duplicate `<Navbar>` or `<Footer>` in routes — both are rendered once in `App.js`.
- No duplicate global content block found in React layer.
- **Incorrect location text** found in ContactPage.js, TermsPage.js, PrivacyPage.js: shows "Cape Town, South Africa" instead of Garden Route / Sedgefield.

---

## 13. Conversion Tracking Gaps

- `purchase` event fires from `/payment/success` return page using URL params only — not from verified ITN. This means purchase events fire even if payment is cancelled or not yet confirmed.
- No `payment_error`, `checkout_validation_error`, or `shipping_rule_applied` events implemented.
- Analytics uses custom `trackEvent` wrapper (see `/lib/analytics.js`).

---

## 14. Security Observations

- `merchant_key` was briefly being sent as a form field — this is PayFast's required implementation; however it should never appear in client-side logs.
- `PAYFAST_DEBUG=true` was set temporarily — reverted to `false`.
- Admin credentials are hardcoded in startup seed: `EmberAdmin2024!` — should be env var.
- CORS is `allow_origins=["*"]` — acceptable for API but should be restricted in production.
- Idempotency missing in ITN handler — duplicate ITN callbacks could theoretically set an order paid multiple times (low risk but should be guarded).

---

## 15. Manual Checks Required

1. Verify PayFast merchant account is fully verified (KYC/FICA complete).
2. Verify notify_url is publicly reachable from PayFast servers.
3. Confirm `BACKEND_URL` env var is set correctly in production.
4. Test ITN delivery using PayFast sandbox before going live.
