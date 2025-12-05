# Subscription System Testing Checklist

## Phase 1: Database Schema ✅
- [x] Migration file created
- [ ] Migration applied successfully on Vercel
- [ ] Tables created: `user_subscriptions`, `promo_codes`, `usage_tracking`
- [ ] Foreign keys and indexes created correctly
- [ ] `subscription_tier` column removed from `appeal_limits`

## Phase 2: Stripe Integration ✅
- [ ] Stripe API keys added to Admin Settings
- [ ] Test Connection button works
- [ ] Stripe client helper functions work
- [ ] Webhook endpoint accessible (test with Stripe CLI)
- [ ] Webhook signature verification works

## Phase 3: Signup Flow ✅
- [ ] New user signup redirects to tier selection
- [ ] Free tier selection creates FREE subscription
- [ ] Pro tier selection redirects to payment page
- [ ] Payment page displays monthly/yearly options
- [ ] Promo code validation works
- [ ] Stripe Checkout session created successfully
- [ ] Success page verifies subscription
- [ ] User redirected to dashboard after subscription

## Phase 4: Admin Promo Codes ✅
- [ ] Promo codes page accessible in admin dashboard
- [ ] Create promo code with all fields
- [ ] Edit existing promo code
- [ ] Delete promo code
- [ ] Activate/deactivate promo code
- [ ] Unlimited uses promo code works
- [ ] Time-limited promo code expires correctly
- [ ] Percentage discount calculates correctly
- [ ] Fixed amount discount calculates correctly
- [ ] Billing cycle restrictions work

## Phase 5: Feature Gating ✅
- [ ] `getUserSubscription()` creates FREE subscription if none exists
- [ ] `hasFeatureAccess()` correctly identifies Pro-only features
- [ ] `getFeatureLimit()` returns correct limits for FREE vs PRO
- [ ] `canUseFeature()` checks both access and limits
- [ ] `recordFeatureUsage()` increments usage correctly

## Phase 6: Integration Points ✅
- [ ] Appeals system uses subscription tier (4 Free, 12 Pro)
- [ ] Appeal limit updates when subscription changes
- [ ] "That's The One" feature gated (10 Free, unlimited Pro)
- [ ] Tournament credits tracked (0 Free, 4/month Pro)
- [ ] Speed mode debates restricted to Pro users
- [ ] Upgrade prompts shown for Free users trying Pro features

## Phase 7: Subscription Management ✅
- [ ] Subscription settings page accessible
- [ ] Current subscription details displayed
- [ ] Usage statistics displayed correctly
- [ ] Cancel subscription works (at period end)
- [ ] Reactivate cancelled subscription works
- [ ] Switch billing cycle (monthly/yearly) works
- [ ] Upgrade from Free to Pro works

## Phase 8: Usage Tracking ✅
- [ ] Usage API returns correct current usage
- [ ] Usage limits displayed correctly
- [ ] Monthly reset job runs correctly
- [ ] Tournament credits roll over (max 12)
- [ ] Appeal counts reset monthly
- [ ] "That's The One" counts reset monthly

## Phase 9: UI/UX Enhancements ✅
- [ ] Upgrade prompts displayed when needed
- [ ] Tier badges displayed on profiles
- [ ] Verified badge shown for Pro users
- [ ] Feature comparison tables visible
- [ ] Upgrade CTAs throughout app

## Phase 10: End-to-End Testing

### Test Scenario 1: New User Signup (Free)
1. [ ] Sign up new user
2. [ ] Select Free tier
3. [ ] Verify FREE subscription created
4. [ ] Verify appeal limit is 4
5. [ ] Verify can use Free features
6. [ ] Verify cannot use Pro features (upgrade prompt shown)

### Test Scenario 2: New User Signup (Pro)
1. [ ] Sign up new user
2. [ ] Select Pro tier
3. [ ] Complete Stripe checkout
4. [ ] Verify PRO subscription created
5. [ ] Verify appeal limit is 12
6. [ ] Verify can use all Pro features
7. [ ] Verify usage tracking initialized

### Test Scenario 3: Promo Code Usage
1. [ ] Create promo code in admin (50% off, unlimited)
2. [ ] Use promo code during signup
3. [ ] Verify discount applied correctly
4. [ ] Verify final price is correct
5. [ ] Verify promo code usage incremented
6. [ ] Verify Stripe coupon created

### Test Scenario 4: Subscription Cancellation
1. [ ] Cancel Pro subscription
2. [ ] Verify `cancelAtPeriodEnd` set to true
3. [ ] Verify subscription remains active
4. [ ] Verify can still use Pro features
5. [ ] Wait for period end (or manually trigger)
6. [ ] Verify subscription downgraded to FREE
7. [ ] Verify appeal limit reduced to 4

### Test Scenario 5: Feature Usage Limits
1. [ ] Use all 4 appeals (Free user)
2. [ ] Verify cannot appeal after limit reached
3. [ ] Verify upgrade prompt shown
4. [ ] Upgrade to Pro
5. [ ] Verify appeal limit increased to 12
6. [ ] Verify can appeal again

### Test Scenario 6: Monthly Reset
1. [ ] Use some appeals, "That's The One", tournament credits
2. [ ] Trigger monthly reset job
3. [ ] Verify appeal count reset to 0
4. [ ] Verify "That's The One" count reset
5. [ ] Verify tournament credits rolled over (max 12)
6. [ ] Verify new period started correctly

### Test Scenario 7: Webhook Events
1. [ ] Test `customer.subscription.created` webhook
2. [ ] Test `customer.subscription.updated` webhook
3. [ ] Test `customer.subscription.deleted` webhook
4. [ ] Test `invoice.payment_succeeded` webhook
5. [ ] Test `invoice.payment_failed` webhook
6. [ ] Verify database updated correctly for each event

## Security Testing
- [ ] Subscription checks are server-side only
- [ ] Stripe webhook signature verified
- [ ] Promo codes validated server-side
- [ ] Feature access cannot be bypassed client-side
- [ ] Usage limits enforced server-side

## Performance Testing
- [ ] Subscription checks don't cause N+1 queries
- [ ] Usage tracking queries optimized
- [ ] Monthly reset job completes in reasonable time
- [ ] Stripe API calls don't block requests

## Edge Cases
- [ ] User with no subscription (should get FREE)
- [ ] User cancels and reactivates same day
- [ ] Promo code expires during checkout
- [ ] Promo code max uses reached during checkout
- [ ] Stripe subscription fails but user created
- [ ] Webhook received before user subscription created
- [ ] Multiple simultaneous subscription checks

## Production Readiness
- [ ] Stripe keys in production environment
- [ ] Webhook endpoint configured in Stripe Dashboard
- [ ] CRON job configured for monthly reset
- [ ] Error logging and monitoring set up
- [ ] User support documentation updated
- [ ] Admin training completed

---

## Quick Test Commands

### Test Stripe Connection
```bash
# In Admin Dashboard → Settings → Test Stripe Connection
```

### Test Promo Code
```bash
# Create test promo code: TEST50 (50% off, unlimited)
# Use during checkout
```

### Test Webhook (using Stripe CLI)
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger customer.subscription.created
```

### Test Monthly Reset
```bash
# Call: GET /api/cron/reset-usage
# With header: Authorization: Bearer {CRON_SECRET}
```

---

**Last Updated:** December 2024
**Status:** Ready for Testing

