# Resend Automations Build Guide

This guide documents the Resend automations to build for Cape Ember Coffee Co. Each automation is driven by a custom lifecycle event.

## Recommended automations

1. Subscription Confirmation
   - Trigger event: `subscriber.form_submitted`
   - Goal: send double opt-in confirmation email to subscribers
   - Stop condition: `subscriber.confirmed`

2. Ember Circle Welcome
   - Trigger event: `subscriber.confirmed`
   - Goal: send a welcome sequence to new confirmed subscribers
   - Stop condition: `subscriber.unsubscribed`

3. Abandoned Cart
   - Trigger event: `cart.abandoned`
   - Goal: send a gentle reminder sequence for stalled carts
   - Stop conditions: `checkout.completed`, `order.placed`

4. Order Confirmation
   - Trigger event: `order.placed`
   - Goal: transactional confirmation email on paid orders

5. First Purchase Education
   - Trigger event: `customer.first_purchase`
   - Goal: introduce first-time buyers to brewing guides and best practices

6. Repeat Customer Thank-you
   - Trigger event: `customer.repeat_purchase`
   - Goal: acknowledge repeat purchase without excessive promotion

7. Bundle Buyer Journey
   - Trigger event: `customer.bundle_purchase`
   - Goal: deliver education for bundle owners after delivery

8. Shipping Confirmation
   - Trigger event: `order.shipped`
   - Goal: notify customers when their order has shipped

9. Delivery Follow-up
   - Trigger event: `order.delivered`
   - Goal: notify customers when delivery is confirmed and begin post-delivery engagement

10. Review Request
    - Trigger event: `review.request_eligible`
    - Goal: request honest feedback after delivery and a trial period

11. 45-Day Re-engagement
    - Trigger event: `customer.inactive_45_days`
    - Goal: re-engage confirmed marketing subscribers who have not purchased recently

12. 90-Day Win-back
    - Trigger event: `customer.inactive_90_days`
    - Goal: reconnect with older inactive buyers without excessive frequency

## Event schema recommendations

Each event should include a stable payload shape with the following fields:
- `event_id`
- `event_name`
- `occurred_at`
- `source`
- `customer_id`
- `contact_id`
- `email`
- `first_name`
- `currency`
- `properties`

### Example: `product.added_to_cart`
```json
{
  "event_id": "evt_123",
  "event_name": "product.added_to_cart",
  "occurred_at": "2026-07-19T12:34:56Z",
  "source": "cape_ember_website",
  "customer_id": "user_123",
  "email": "customer@example.com",
  "first_name": "Ava",
  "currency": "ZAR",
  "properties": {
    "product_id": "ember-reserve",
    "product_slug": "ember-reserve",
    "product_name": "Ember Reserve",
    "variant_id": "ember-250g-whole",
    "grind": "whole_bean",
    "quantity": 1,
    "unit_price": 169.00,
    "cart_id": "cart_abc",
    "cart_total": 169.00,
    "product_url": "https://capeembercoffee.co.za/products/ember-reserve",
    "image_url": "https://capeembercoffee.co.za/assets/cape-ember/ember-reserve.png"
  }
}
```

### Example: `order.placed`
```json
{
  "event_id": "evt_456",
  "event_name": "order.placed",
  "occurred_at": "2026-07-19T12:45:00Z",
  "source": "cape_ember_website",
  "customer_id": "user_123",
  "email": "customer@example.com",
  "first_name": "Ava",
  "currency": "ZAR",
  "properties": {
    "order_id": "order_abc",
    "order_number": "CE-000123",
    "order_total": 638.00,
    "shipping_total": 0,
    "currency": "ZAR",
    "item_count": 4,
    "contains_bundle": false,
    "order_url": "https://capeembercoffee.co.za/account/orders/order_abc",
    "items": [
      {
        "product_id": "landscape-bundle",
        "product_name": "Landscape Bundle",
        "variant": "Whole Bean",
        "quantity": 1,
        "unit_price": 638.00,
        "image_url": "https://capeembercoffee.co.za/assets/cape-ember/landscape-bundle.jpeg"
      }
    ]
  }
}
```

## Automation mapping
- `subscriber.form_submitted` → Ember Circle confirmation entry
- `subscriber.confirmed` → Welcome series
- `cart.abandoned` → Abandoned cart reminders
- `order.placed` → Transactional order confirmation
- `customer.first_purchase` → First purchase education
- `customer.repeat_purchase` → Repeat customer thank-you
- `customer.bundle_purchase` → Bundle buyer journey
- `order.shipped` → Shipping confirmation
- `order.delivered` → Delivery follow-up
- `review.request_eligible` → Review request
- `customer.inactive_45_days` → 45-day re-engagement
- `customer.inactive_90_days` → 90-day win-back

## Testing procedure
- Confirm every event payload is schema-valid before sending
- Validate idempotency by firing the same event twice with the same `idempotency_key`
- Verify that `EMAIL_AUTOMATION_MODE=disabled` stores events but does not call Resend
- Verify that `EMAIL_AUTOMATION_MODE=test` only sends to allowlisted emails
- Validate that `order.placed` is only emitted after verified successful payment
- Validate that `subscriber.confirmed` is only emitted after a valid confirmation flow
- Confirm webhook endpoint signature verification in Resend
