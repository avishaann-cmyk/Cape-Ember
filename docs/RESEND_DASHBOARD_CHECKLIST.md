# Resend Dashboard Checklist

Use this checklist when configuring Resend for Cape Ember Coffee Co.

1. Verify sending domain
   - Add `capeembercoffee.co.za` to Resend domains
   - Confirm SPF record
   - Confirm DKIM record
   - Add DMARC policy

2. Create contact properties
   - `coffee_preference`
   - `brew_method`
   - `signup_source`
   - `consent_status`
   - `consent_timestamp`
   - `customer_status`
   - `first_order_date`
   - `last_order_date`
   - `total_orders`
   - `total_spent`
   - `average_order_value`
   - `favourite_product`
   - `last_product_viewed`
   - `last_cart_value`
   - `last_email_event`
   - `birthday_month`
   - `province`

3. Create segments
   - Ember Circle
   - Pending Confirmation
   - No Purchase
   - First-Time Customer
   - Repeat Customer
   - VIP
   - Landscape Bundle
   - Fynbos
   - Garden Route
   - Karoo
   - Ember Reserve
   - Smooth Preference
   - Bright Preference
   - Bold Preference
   - Moka Pot
   - Espresso
   - Plunger
   - Inactive 45 Days
   - Inactive 90 Days
   - Suppressed

4. Create custom events
   - `subscriber.form_submitted`
   - `subscriber.confirmed`
   - `subscriber.preferences_updated`
   - `subscriber.unsubscribed`
   - `product.viewed`
   - `product.added_to_cart`
   - `product.removed_from_cart`
   - `cart.updated`
   - `cart.abandoned`
   - `cart.recovered`
   - `checkout.started`
   - `checkout.completed`
   - `checkout.failed`
   - `order.placed`
   - `order.payment_confirmed`
   - `order.fulfilled`
   - `order.shipped`
   - `order.delivered`
   - `order.cancelled`
   - `order.refunded`
   - `review.request_eligible`
   - `review.submitted`
   - `customer.first_purchase`
   - `customer.repeat_purchase`
   - `customer.bundle_purchase`
   - `customer.inactive_45_days`
   - `customer.inactive_90_days`
   - `customer.birthday_month`

5. Create automations
   - Subscription Confirmation
   - Ember Circle Welcome
   - Abandoned Cart
   - Order Confirmation
   - First Purchase Education
   - Repeat Customer Thank-you
   - Bundle Buyer Journey
   - Shipping Confirmation
   - Delivery Follow-up
   - Review Request
   - Inactive 45-Day Win-back
   - Inactive 90-Day Win-back

6. Create topics if supported
   - Ember Circle News
   - Product Releases
   - Brewing Guides
   - Special Offers
   - Journey Journal

7. Configure webhook endpoint
   - Install webhook endpoint in Resend
   - Use `RESEND_WEBHOOK_SECRET`
   - Validate signatures server-side
   - Only accept verified requests

8. Test every automation
   - Fire a test event for each custom event
   - Confirm correct contact and segment updates
   - Confirm stop conditions work
   - Confirm frequency limits are respected

9. Monitor
   - Inspect automation runs
   - Confirm transactional flow behaves separately from marketing
   - Confirm no duplicate events are emitted
   - Confirm suppressed contacts are excluded from marketing segments
