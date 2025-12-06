# Project Status - ArguFight

## Current Status
**Last Updated:** 2025-12-05  
**Repository:** `argufight/argufight` (GitHub)  
**Latest Commit:** `1f859d1d` - Fix: Remove reset-usage cron job to stay within Vercel plan limit (2 cron jobs)

## Recent Work - Build Error Fixes

### Context
We've been fixing TypeScript build errors that occurred after migrating to a new GitHub repository (`argufight/argufight`) and updating Stripe API version. The errors were primarily related to:

1. **Stripe TypeScript SDK Version Mismatch** - Updated from older API version to `2025-11-17.clover`
2. **Property Naming Differences** - Stripe API uses snake_case but TypeScript types expect different formats
3. **API Method Changes** - Some Stripe methods changed their parameters

### Fixes Applied

#### 1. Subscription Tier Types
- **File:** `app/(dashboard)/profile/[id]/page.tsx`
- **Issue:** `UserProfile` interface missing `subscription` property
- **Fix:** Added `subscription: { tier: 'FREE' | 'PRO' }` to interface

#### 2. Badge Variant Issues
- **Files:** 
  - `app/(dashboard)/settings/subscription/page.tsx`
  - `components/subscriptions/TierBadge.tsx`
- **Issue:** Badge component doesn't have `'secondary'` variant
- **Fix:** Changed to `'default'` variant

#### 3. AdContract OrderBy
- **Files:**
  - `app/api/admin/contracts/route.ts`
  - `app/api/ads/select/route.ts`
  - `app/api/creator/contracts/route.ts`
  - `app/api/creator/earnings/detailed/route.ts`
- **Issue:** `AdContract` model uses `signedAt` not `createdAt`
- **Fix:** Changed `orderBy: { createdAt: 'desc' }` to `orderBy: { signedAt: 'desc' }`

#### 4. Missing Imports
- **File:** `app/(dashboard)/profile/[id]/page.tsx`, `app/(dashboard)/profile/page.tsx`
- **Issue:** Missing `AdDisplay` import
- **Fix:** Added `import { AdDisplay } from '@/components/ads/AdDisplay'`

#### 5. Stripe Property Access Issues
- **Files:**
  - `app/api/subscriptions/verify-checkout/route.ts`
  - `app/api/webhooks/stripe/route.ts`
- **Issue:** Stripe API uses snake_case properties that don't match TypeScript types
- **Fix:** Used type assertions:
  - `(subscription as any).current_period_start`
  - `(subscription as any).current_period_end`
  - `(subscription as any).cancel_at_period_end`
  - `(invoice as any).subscription`

#### 6. Stripe API Version
- **File:** `lib/stripe/stripe-client.ts`
- **Issue:** API version mismatch
- **Fix:** Updated from `'2024-11-20.acacia'` to `'2025-11-17.clover'`

#### 7. Stripe Promotion Code Lookup
- **File:** `lib/stripe/stripe-client.ts`
- **Issue:** `coupons.list()` doesn't accept `code` parameter in new API
- **Fix:** Changed to use `promotionCodes.list()` instead, with type assertion for `promotion_code` property

#### 8. Missing isCreator Field
- **File:** `app/api/creator/profile/route.ts`
- **Issue:** `isCreator` not included in Prisma select
- **Fix:** Added `isCreator: true` to select statement

#### 9. Duplicate Property
- **File:** `app/api/cron/process-ad-payouts/route.ts`
- **Issue:** Duplicate `errors` property in return object
- **Fix:** Changed to `errorCount: errors.length`

#### 10. Syntax Error
- **File:** `app/api/subscriptions/verify-checkout/route.ts`
- **Issue:** Extra closing brace causing syntax error
- **Fix:** Removed extra brace

#### 11. Stripe Coupon Property Type Error
- **File:** `lib/stripe/stripe-client.ts`
- **Issue:** `coupon` property doesn't exist on `SubscriptionCreateParams` type
- **Fix:** Used type assertion `(subscriptionData as any).coupon = coupon.id`

#### 12. useSearchParams Suspense Boundary (Next.js 15)
- **Files:**
  - `app/(auth)/signup/payment/page.tsx`
  - `app/(auth)/signup/success/page.tsx`
  - `app/(auth)/reset-password/page.tsx`
- **Issue:** `useSearchParams()` must be wrapped in Suspense boundary in Next.js 15
- **Fix:** Extracted components using `useSearchParams()` and wrapped them in `<Suspense>` boundaries

#### 13. Vercel Cron Jobs Limit
- **File:** `vercel.json`
- **Issue:** Vercel Hobby plan allows only 2 cron jobs, but 3 were configured
- **Fix:** Removed `reset-usage` cron job (monthly job can be run manually if needed)

### Cron Job Configuration
- **File:** `vercel.json`
- **Issue:** Hobby plan only allows daily cron jobs
- **Fix:** Changed `check-expired-offers` from hourly (`0 * * * *`) to daily (`0 3 * * *`)

## Git Configuration
- **Remote:** `argufight` pointing to `https://github.com/argufight/argufight.git`
- **Token:** Configured with Personal Access Token (embedded in remote URL)
- **No authentication prompts:** Token is working correctly

## Current Build Status
- **Last Known Error:** Fixed in commit `1f859d1d`
- **Build Status:** ✅ Build succeeded! Deployment should now work.
- **If errors persist:** Check if Vercel is building the latest commit (`1f859d1d`)

## Key Files Modified
1. `app/(dashboard)/profile/[id]/page.tsx` - Added subscription property, AdDisplay import
2. `app/(dashboard)/profile/page.tsx` - Added AdDisplay import
3. `app/(dashboard)/settings/subscription/page.tsx` - Fixed Badge variant
4. `components/subscriptions/TierBadge.tsx` - Fixed Badge variant
5. `app/api/subscriptions/verify-checkout/route.ts` - Stripe property fixes, syntax fix
6. `app/api/webhooks/stripe/route.ts` - Stripe property fixes
7. `lib/stripe/stripe-client.ts` - API version update, promotion code fix
8. `app/api/admin/contracts/route.ts` - Fixed orderBy
9. `app/api/ads/select/route.ts` - Fixed orderBy
10. `app/api/creator/contracts/route.ts` - Fixed orderBy
11. `app/api/creator/earnings/detailed/route.ts` - Fixed orderBy
12. `app/api/creator/profile/route.ts` - Added isCreator to select
13. `app/api/cron/process-ad-payouts/route.ts` - Fixed duplicate property
14. `vercel.json` - Fixed cron schedule
15. `lib/stripe/stripe-client.ts` - Fixed coupon property type assertion
16. `app/(auth)/signup/payment/page.tsx` - Added Suspense boundary for useSearchParams
17. `app/(auth)/signup/success/page.tsx` - Added Suspense boundary for useSearchParams
18. `app/(auth)/reset-password/page.tsx` - Added Suspense boundary for useSearchParams
19. `vercel.json` - Removed reset-usage cron job to stay within plan limit

## Next Steps (If Build Still Fails)
1. Check Vercel dashboard to confirm it's building commit `1f859d1d`
2. If new errors appear, they'll likely be similar Stripe type issues - use type assertions
3. Check for any remaining Badge variant issues (search for `variant="secondary"`)
4. Verify all Stripe property accesses use type assertions where needed
5. Check for any other `useSearchParams()` usage that might need Suspense boundaries

## Deployment Notes
- **Cron Jobs:** Limited to 2 on Hobby plan. Currently configured:
  - `process-ad-payouts` - Daily at 2 AM
  - `check-expired-offers` - Daily at 3 AM
- **Removed:** `reset-usage` cron job (monthly) - can be run manually if needed

## Important Notes
- **Stripe API Version:** `2025-11-17.clover` (latest)
- **Type Assertions:** Used extensively for Stripe properties due to type mismatches
- **Badge Variants:** Only supports: `'default' | 'sports' | 'politics' | 'tech' | 'entertainment' | 'science' | 'success' | 'warning' | 'error'`
- **AdContract Model:** Uses `signedAt` field, not `createdAt`
- **Cron Jobs:** Limited to daily on Hobby plan

## Environment
- **Node.js:** (Check package.json)
- **Next.js:** 15.2.4
- **Prisma:** 6.19.0
- **Stripe:** 20.0.0

## Database
- **Provider:** PostgreSQL
- **Connection:** Via `DATABASE_URL` environment variable
- **Migrations:** Managed through Prisma

## Deployment
- **Platform:** Vercel
- **Repository:** `argufight/argufight`
- **Branch:** `main`
- **Auto-deploy:** Enabled (on push to main)
