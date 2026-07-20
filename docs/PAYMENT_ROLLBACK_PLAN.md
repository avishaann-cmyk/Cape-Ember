# Payment Rollback Plan

## If PayFast Changes Cause Issues

### Rollback steps
1. `git log --oneline` — identify last known good commit
2. `git revert HEAD` — revert the last commit without losing history
3. Restart backend: `pkill -f "uvicorn server:app" && cd /app/backend && python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload`

### Emergency: Disable PayFast temporarily
Set in `.env`:
```
PAYFAST_ENABLED=false
```
Then add a guard in the checkout route to return a clear error message.

## If Stitch Causes Issues
- Stitch is behind `STITCH_ENABLED=false` by default
- If accidentally enabled, set back to `false` and redeploy

## Database Safety
- Orders created before payment are in state `pending_payment`
- They are not lost if payment fails — customer can retry
- No orders are ever deleted by the payment flow
- If an order is stuck in `pending_payment`, admin can manually update via `/admin/orders`
