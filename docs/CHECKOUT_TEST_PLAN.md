# Checkout Test Plan

## PayFast Tests

| # | Test | Expected |
|---|---|---|
| 1 | Valid sandbox payment (card) | Order marked paid, confirmation email sent |
| 2 | Cancelled payment | Payment attempt cancelled, cart retained, order stays pending_payment |
| 3 | Failed payment | Order marked payment_failed, customer can retry |
| 4 | Duplicate ITN notification | Second notification ignored (idempotent) |
| 5 | Invalid ITN signature | 200 OK returned but order not updated |
| 6 | ITN amount mismatch | Order flagged, not marked paid |
| 7 | Return page before ITN | Shows "verification in progress" state |
| 8 | Browser closed after payment | ITN still marks order paid |
| 9 | Customer refreshes success page | Purchase event fires only once |

## VAT Tests

| # | Test | Expected |
|---|---|---|
| 1 | Add R149 product to cart | Subtotal = R149.00, VAT extracted = R19.43, total NOT increased |
| 2 | Checkout total = cart total | No VAT added a second time |
| 3 | PayFast `amount` = server `total` | Identical to 2 decimal places |

## Sedgefield Delivery Tests

| # | Input city | Expected shipping |
|---|---|---|
| 1 | Sedgefield | R0.00 — "Free local delivery — Sedgefield" |
| 2 | sedgefield | R0.00 (case-insensitive) |
| 3 | " Sedgefield " | R0.00 (whitespace trimmed) |
| 4 | Cape Town | R50.00 (Western Cape rate) |
| 5 | (blank city) | Normal rate applied |
| 6 | outside-Sedgefield | Normal rate (not a free-delivery suburb) |
| 7 | City changed from Sedgefield to Johannesburg | Recalculates to paid shipping |

## Cart Tests

| # | Test | Expected |
|---|---|---|
| 1 | Add product → correct image shown | Exact product image, not placeholder |
| 2 | Quantity +1 → line total updates | Correct arithmetic |
| 3 | Remove item | Item gone, totals updated |
| 4 | Refresh page | Cart persists via backend session |
| 5 | Bundle in cart | Bundle artwork shown, 4x250g label, free delivery noted |

## Full Journey

1. Add Fynbos Roast (250g Whole Bean) to cart
2. Enter non-Sedgefield address → confirm shipping charge shown
3. Change city to Sedgefield → confirm shipping shows Free
4. Proceed to checkout
5. Confirm total is unchanged (no VAT added)
6. Submit via PayFast sandbox
7. Complete payment on PayFast sandbox page
8. Confirm return to /payment/success
9. Check database: order.status = paid
10. Check email: confirmation email received
11. Check analytics: purchase event fired once (not on return URL, on ITN)
