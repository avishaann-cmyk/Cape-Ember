# Stitch Onboarding & Setup Guide

## Current Status
Stitch integration code exists in the backend but is **not fully functional**. Credentials exist in `.env` but return `invalid_client`. Stitch should remain behind a feature flag until sandbox testing passes.

---

## Environment Variables Required

```bash
STITCH_ENABLED=false          # Set to true only after verified sandbox payments
STITCH_ENVIRONMENT=sandbox    # sandbox | production
STITCH_CLIENT_ID=             # From Stitch dashboard
STITCH_CLIENT_SECRET=         # From Stitch dashboard
STITCH_WEBHOOK_SECRET=        # From Stitch dashboard (webhook signing secret)
STITCH_PRIVATE_KEY=           # RSA private key if using private_key_jwt auth (optional)
STITCH_PRIVATE_KEY_PATH=      # Path to private key file (alternative to inline)
```

---

## Onboarding Steps

### 1. Create a Stitch account
- Visit https://stitch.money
- Register as a merchant
- Complete business verification

### 2. Obtain API credentials
- Log in to Stitch developer dashboard
- Create a new application
- Copy Client ID and Client Secret
- Note whether your account uses:
  - `client_credentials` with Basic Auth
  - `private_key_jwt` with RSA key pair

### 3. Confirm available payment products
Stitch offers multiple products. Confirm which are enabled for your account:
- **Stitch Express** — hosted checkout (simplest integration)
- **Payment API** — direct API integration
- **LinkPay** — bank account-based payments

The current integration code uses the `clientPaymentInitiationRequestCreate` GraphQL mutation which is the Stitch Express / PaymentRequest flow.

### 4. Sandbox testing
- Set `STITCH_ENVIRONMENT=sandbox`
- Complete a test payment through the Stitch sandbox
- Verify webhook delivery and order status update

### 5. Go live
- Set `STITCH_ENVIRONMENT=production`
- Set `STITCH_ENABLED=true`
- Monitor first live transactions closely

---

## Current Credential Issue
The current credentials (`cd59924f-...`) are returning `invalid_client`. This may be because:
- The credentials are test credentials that have expired
- The account requires a private RSA key for JWT authentication
- The account is not yet activated

**Action required:** Log in to the Stitch developer portal and generate fresh credentials.

---

## Feature Flag
Stitch is currently hidden behind `STITCH_ENABLED=false`. Until this flag is true, Stitch will not appear at checkout. PayFast remains the active payment method.
