# Cape Ember Conversion Audit
**Date:** 2026-07-20

---

## Summary

Based on inspection of code, database, and checkout architecture — the primary reason the website is not generating confirmed sales is **the PayFast payment flow has never successfully processed a single order**. All 11 orders in the database are stuck at `pending` / `pending_payment`. Zero have reached `paid` status.

The entire conversion funnel breaks at the payment submission step. Until PayFast works, any other optimisation is secondary.

---

## Root Cause: PayFast Never Working

Evidence:
- 11 orders, all `payment_status: pending`
- No `payfast_payment_id` stored on any order
- `m_payment_id` in form changed to `order_number`, but webhook lookup uses `{"_id": order_id}` → lookup always fails
- `merchant_key` was removed from form fields → 400 signature mismatch

---

## Funnel Breakdown

| Stage | Assessment | Issue |
|---|---|---|
| Homepage | Good — clear CTA, good product cards | Minor: location says "Cape Town" not Sedgefield |
| Shop page | Good — filtering, sorting, search | OK |
| Product detail | Good — variants, grind selection | OK |
| Cart | Good — totals, coupon, progress bar | Minor: upsell grid may distract |
| Checkout | Reasonable — 3-step form | Good |
| Payment | **BROKEN** — signature mismatch → 400 | Critical |
| Success page | Fires `purchase` event from URL, not ITN | Premature event |
| Order confirmation email | Depends on ITN — never sent | Critical |

---

## Identified Conversion Risks

### Critical (blocking sales)
1. PayFast 400 error — signature mismatch (being fixed in this audit)
2. ITN webhook never processes payments — no order marked paid
3. No order confirmation email ever sent to customers

### High
4. Return page fires `purchase` analytics event from URL, not from verified payment
5. `BACKEND_URL` may not be publicly reachable (notify_url must be reachable by PayFast)
6. No payment attempt audit trail — can't diagnose which payments reached PayFast

### Medium
7. Products served from in-memory map — if server restarts with code changes, prices/stock could drift
8. Incorrect location "Cape Town, South Africa" in Contact, Terms, Privacy pages — reduces trust for local Sedgefield customers
9. Sedgefield free delivery rule works in code but has no prominent pre-checkout messaging
10. No abandoned cart recovery email (Resend integration exists but not triggered on cart abandon)

### Low
11. Upsell products grid in cart adds cognitive load
12. Fake review ratings (4.9 stars, 127 reviews) could harm trust — replace with honest early-adopter social proof
13. Admin password hardcoded in startup seed — should be env var
14. CORS allows all origins

---

## Traffic and Analytics

- `trackEvent()` calls exist throughout the app for `view_item`, `add_to_cart`, `begin_checkout`
- Analytics provider depends on `REACT_APP_GA4_MEASUREMENT_ID` env var — if not set, events are logged to console only
- `purchase` event fires from return URL, not from ITN verification

---

## Recommendations (in priority order)

1. Fix PayFast payment flow (done in this branch)
2. Verify `BACKEND_URL` is publicly reachable and ITN is being delivered
3. Test a sandbox payment end-to-end before going live
4. Set `REACT_APP_GA4_MEASUREMENT_ID` so analytics events are tracked in production
5. Replace fake reviews with honest social proof
6. Add abandoned cart email trigger (Resend automation)
7. Update location text to Garden Route / Sedgefield
8. Promote Sedgefield free delivery more prominently at checkout
