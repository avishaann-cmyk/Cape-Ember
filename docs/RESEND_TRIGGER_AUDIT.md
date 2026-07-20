# Resend Trigger Audit

## Current framework
- Backend: Python FastAPI application in `/app/backend/server.py`
- Database: MongoDB via `motor.motor_asyncio.AsyncIOMotorClient`
- Frontend: React app under `/app/frontend` using `create-react-app` / `craco`
- Email provider: Resend Python SDK (`resend>=2.0.0`)
- Payment providers: PayFast and Stitch
- Hosting: environment variables and `.env` driven local/backend configuration

## Resend package version
- Resend dependency declared in `backend/requirements.txt` as `resend>=2.0.0`

## Existing API routes
- `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/refresh`
- `/api/cart`, `/api/cart/add`, `/api/cart/items/{item_id}`, `/api/cart/coupon`
- `/api/checkout` using server-side checkout and order creation
- `/api/orders`, `/api/payfast/create-payment`, `/api/stitch/create-payment`
- `/api/subscriptions/request` for Ember Circle manual subscription requests
- `/api/webhooks/payfast`, `/api/webhooks/stitch`
- `/api/admin/orders/{order_id}/resend-confirmation`

## Database collections
- `users` — customer records and marketing consent (`accepts_marketing`)
- `carts` — authenticated user carts
- `guest_carts` — guest session carts
- `orders` — order documents with payment state and shipping
- `subscriptions` — Ember Circle manual subscription requests
- `wishlists`, `reviews`, `deliveries`, `coupons`, `analytics_events`, `webhook_events`
- `settings` / `content` / `inventory_adjustments`

## Newsletter and contact flow
- Current marketing-related concepts are primarily:
  - `accepts_marketing` on user registration
  - Ember Circle subscription request via `/api/subscriptions/request`
- There is no existing double opt-in or subscriber confirmation flow in the backend.
- The existing site does not currently surface a dedicated Resend contact sync or marketing automation trigger.

## Cart flow
- Cart state stored server-side in MongoDB with `items`, `coupon_code`, and `updated_at`
- Authenticated user carts use `carts`, guests use `guest_carts`
- Add / update / remove operations are validated against `PRODUCTS_MAP`
- Cart total calculation is authoritative on the backend using product variant prices and coupon rules

## Checkout flow
- `/api/checkout` builds an order from the authoritative cart and product catalog
- Shipping, VAT, discounts, and totals are calculated server-side
- Payment method chosen server-side via `payment_method` in checkout payload

## Payment confirmation flow
- PayFast: `notify_url` points to `/api/webhooks/payfast`
- Stitch: `create_stitch_payment()` returns a redirect URL and Stitch webhook uses `/api/webhooks/stitch`
- Order confirmation emails are currently sent from webhook success handlers

## Fulfilment / tracking flow
- Admin can update order status via `/api/admin/orders/{order_id}/status`
- Shipping notification email is sent when status becomes `shipped` and `tracking_number` is present
- Delivery status is managed via separate `deliveries` and `admin/deliveries` routes

## Existing webhook endpoints
- `/api/webhooks/payfast` verifies PayFast ITN and updates `orders`
- `/api/webhooks/stitch` verifies Stitch HMAC signature and updates `orders`

## Environment variables in use
- `MONGO_URL`, `DB_NAME`
- `JWT_SECRET`, `CORS_ORIGINS`
- `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`, `PAYFAST_SANDBOX`
- `STITCH_CLIENT_ID`, `STITCH_CLIENT_SECRET`, `STITCH_WEBHOOK_SECRET`, `STITCH_SANDBOX`
- `EMAIL_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL`
- `RESEND_API_KEY`, `SENDER_EMAIL`
- `FRONTEND_URL`, `REACT_APP_BACKEND_URL`

## Security risks
- `RESEND_API_KEY` is loaded server-side, but Resend client code does not currently expose it in the frontend
- Existing transactional emails use inline `send_resend_email()` wrappers with repeated imports and no automation mode controls
- No current central event log collection or idempotency control for marketing lifecycle events
- No Resend webhook verification or suppression handling for marketing events
- Marketing consent and transactional email states are not clearly separated in the existing backend

## Missing trigger points
- Subscriber confirmation / double opt-in flow is not implemented
- No dedicated `subscriber.confirmed` endpoint or token flow
- No product view event integration for identified customers
- No cart abandonment lifecycle trigger or scheduler
- No explicit `checkout.started` / `checkout.completed` events
- No verified `order.placed` and `order.payment_confirmed` event emission on successful payment
- No first purchase / repeat purchase tracking or automation event firing
- No segment sync for product preferences, bundle buyers, or inactive customers
- No Resend contact sync service for verified contact properties
- No customer suppression guard for unsubscribed / bounced contacts

## Duplicate event risks
- Webhook handlers can process duplicate PayFast or Stitch calls without idempotency checks
- Current background email helpers may be invoked multiple times for the same order
- No dedicated event log makes it impossible to safely deduplicate marketing lifecycle triggers
- Customer contact updates are not consolidated into a single service layer
