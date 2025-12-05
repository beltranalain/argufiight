# Advertising System Testing Checklist

## Phase 1 & 2: Foundation & Admin Dashboard ✅

### Database Schema
- [ ] Run migration: `npx prisma migrate deploy`
- [ ] Verify all tables created: `advertisers`, `campaigns`, `offers`, `ad_contracts`, `impressions`, `clicks`, `creator_tax_info`
- [ ] Verify enums created: `AdvertiserStatus`, `CampaignType`, `CampaignStatus`, `PlacementType`, `PaymentType`, `OfferStatus`, `ContractStatus`, `CreatorStatus`
- [ ] Verify User model has creator fields

### Admin Settings
- [ ] Navigate to `/admin/settings`
- [ ] Find "Advertising Settings" section
- [ ] Toggle "Enable Platform Ads" on/off
- [ ] Toggle "Enable Creator Marketplace" on/off
- [ ] Set creator eligibility requirements (min ELO, debates, account age)
- [ ] Set platform fees for each tier (Bronze, Silver, Gold, Platinum)
- [ ] Save settings and verify they persist

### Admin Pages
- [ ] Navigate to `/admin/platform-ads` - verify page loads
- [ ] Navigate to `/admin/creator-marketplace` - verify page loads
- [ ] Verify status shows "Enabled" or "Disabled" based on settings

---

## Phase 3: Advertiser Dashboard ✅

### Advertiser Application
- [ ] Navigate to `/advertise` (logged out)
- [ ] Fill out application form with test data
- [ ] Submit application
- [ ] Verify redirect to `/advertise/pending`
- [ ] Check email for confirmation (if email service configured)
- [ ] As admin, navigate to `/admin/creator-marketplace`
- [ ] Verify new advertiser appears in "Pending Advertiser Applications"
- [ ] Click "Approve" - verify status changes to APPROVED
- [ ] Check advertiser email for approval notification (if configured)

### Advertiser Dashboard
- [ ] Log in as approved advertiser (use email from application)
- [ ] Navigate to `/advertiser/dashboard`
- [ ] Verify dashboard loads with stats (should be 0 initially)
- [ ] Verify "Payment Setup Required" warning appears if Stripe not connected
- [ ] Verify "Create Campaign" and "Discover Creators" buttons are visible

### Campaign Creation
- [ ] Click "Create Campaign"
- [ ] Step 1: Select "Platform Ads" - verify next button works
- [ ] Step 2: Fill in campaign details (name, category, budget, dates, URL, CTA)
- [ ] Step 3: Upload banner image or enter URL
- [ ] Step 4: (Skip if Platform Ads) Fill targeting options
- [ ] Step 5: Review and submit
- [ ] Verify campaign appears in dashboard with "PENDING_REVIEW" status
- [ ] As admin, verify campaign appears in `/admin/creator-marketplace` pending campaigns
- [ ] Approve campaign - verify status changes to APPROVED

### Creator Discovery
- [ ] Navigate to `/advertiser/creators`
- [ ] Verify creator list loads (if any creators exist)
- [ ] Test filters: min ELO, category, min followers
- [ ] Test search by username
- [ ] Verify creator cards show stats and pricing
- [ ] Click "Make Offer" (verify modal opens or logs action)

---

## Phase 4: Creator Features ✅

### Creator Onboarding
- [ ] Navigate to own profile page (`/profile`)
- [ ] Verify "Become a Creator" CTA appears (if eligible) or requirements list (if not)
- [ ] If eligible, click "Enable Creator Mode"
- [ ] Verify redirect to `/creator/setup`
- [ ] Verify Stripe onboarding link is generated
- [ ] Click "Start Stripe Onboarding" - verify redirects to Stripe
- [ ] Complete Stripe onboarding (test mode)
- [ ] Return to `/creator/setup` - verify status updates (tax form, bank, payouts)

### Creator Dashboard
- [ ] Navigate to `/creator/dashboard`
- [ ] Verify earnings overview shows (0 initially)
- [ ] Verify active contracts section (empty initially)
- [ ] Verify pending offers section (if any)
- [ ] Verify creator stats display correctly

### Offer Management
- [ ] As advertiser, create a creator sponsorship campaign
- [ ] Navigate to `/advertiser/creators` and find a creator
- [ ] Click "Make Offer" (implement offer creation if not done)
- [ ] As creator, navigate to `/creator/offers`
- [ ] Verify offer appears in "PENDING" filter
- [ ] Click "Review" on offer - verify details display
- [ ] Click "Accept Offer" - verify:
  - Contract created
  - Status changes to ACCEPTED
  - Payment held in escrow (check Stripe dashboard)
- [ ] Click "Decline" on another offer - verify status changes to DECLINED

### Earnings Tracking
- [ ] Navigate to `/creator/earnings`
- [ ] Verify summary cards display (total, pending, this month, this year)
- [ ] Verify contract history table
- [ ] Verify monthly breakdown (chart placeholder)

---

## Phase 5: Ad Display System ✅

### Ad Selection
- [ ] Verify ads are enabled in admin settings
- [ ] Create an active campaign (Platform Ads or Creator Sponsorship)
- [ ] Navigate to a profile page - verify banner ad appears at top
- [ ] Navigate to a debate page - verify widget ad in sidebar
- [ ] Complete a debate - verify post-debate ad appears after verdict
- [ ] Verify ads only show when campaigns are active (check dates)

### Ad Tracking
- [ ] View a profile with ad - check browser console for impression tracking
- [ ] Click on ad - verify:
  - Opens destination URL in new tab
  - Click is tracked (check database `clicks` table)
  - Impression count increments (check `impressions` table)
- [ ] Verify contract impression/click counts update

### Ad Priority
- [ ] Create both a creator contract and platform ad for same placement
- [ ] Verify creator contract ad shows (priority)
- [ ] Disable creator contract - verify platform ad shows

---

## Phase 6: Payment & Escrow ✅

### Cron Jobs
- [ ] Verify `vercel.json` has cron job configurations
- [ ] Manually trigger `/api/cron/process-ad-payouts` (with CRON_SECRET)
- [ ] Verify completed contracts are processed:
  - Status changes to COMPLETED
  - Payout sent to creator's Stripe account
  - `payoutSent` and `payoutDate` updated
  - Yearly earnings updated
- [ ] Manually trigger `/api/cron/check-expired-offers`
- [ ] Verify expired offers are marked as EXPIRED

### Escrow Flow
- [ ] As creator, accept an offer
- [ ] Verify payment is held in escrow (check Stripe PaymentIntent)
- [ ] Wait for contract to complete (or manually set endDate in past)
- [ ] Run payout cron job
- [ ] Verify payment released to creator
- [ ] Check creator's Stripe account balance

---

## Phase 7: Analytics & Tracking ✅

### Advertiser Analytics
- [ ] Navigate to `/advertiser/campaigns/[id]/analytics`
- [ ] Verify key metrics display (impressions, clicks, CTR, spent)
- [ ] Verify contracts breakdown shows creator performance
- [ ] Verify chart placeholder (for future implementation)

### Creator Analytics
- [ ] Navigate to `/creator/earnings`
- [ ] Verify detailed earnings breakdown
- [ ] Verify monthly breakdown chart placeholder
- [ ] Verify contract history with payout dates

### Performance Reports
- [ ] As advertiser, view campaign analytics
- [ ] Verify CTR calculation is correct (clicks / impressions * 100)
- [ ] Verify spent calculation matches contract totals
- [ ] As creator, verify earnings calculations match contract payouts

---

## Phase 8: Testing & Polish ✅

### Error Handling
- [ ] Test with ads disabled - verify no errors, ads don't show
- [ ] Test with no active campaigns - verify no errors, no ads
- [ ] Test with invalid campaign dates - verify validation works
- [ ] Test with expired offers - verify they're marked expired
- [ ] Test with creator without Stripe account - verify error handling

### UI/UX
- [ ] Verify all pages are responsive (mobile, tablet, desktop)
- [ ] Verify loading states show correctly
- [ ] Verify error messages are user-friendly
- [ ] Verify success toasts appear after actions
- [ ] Verify navigation flows are intuitive

### Security
- [ ] Verify only approved advertisers can create campaigns
- [ ] Verify only creators can accept offers
- [ ] Verify only contract owners can view analytics
- [ ] Verify cron jobs require authentication
- [ ] Verify ad tracking doesn't expose sensitive data

### Performance
- [ ] Test ad selection performance with many campaigns
- [ ] Test analytics page load time with many contracts
- [ ] Verify database queries are optimized (no N+1)
- [ ] Verify image uploads work correctly

---

## Integration Testing

### End-to-End Flow
1. [ ] Advertiser applies → Admin approves → Advertiser creates campaign → Admin approves campaign
2. [ ] Creator enables mode → Completes Stripe onboarding → Receives offer → Accepts offer
3. [ ] Contract active → Ads display → Impressions/clicks tracked → Contract completes → Payout processed

### Edge Cases
- [ ] Multiple advertisers competing for same creator
- [ ] Campaign expires while contract is active
- [ ] Creator disables creator mode mid-contract
- [ ] Advertiser account suspended
- [ ] Stripe account disconnected

---

## Production Readiness

- [ ] All environment variables set (Stripe keys, CRON_SECRET)
- [ ] Vercel cron jobs configured
- [ ] Email notifications configured (if using)
- [ ] Error logging/monitoring set up
- [ ] Database backups configured
- [ ] Rate limiting on API endpoints (if needed)
- [ ] Documentation updated

---

## Notes

- Test in Stripe test mode first
- Use test data for campaigns and contracts
- Verify all database relationships work correctly
- Check that admin settings persist across sessions
- Ensure creator eligibility checks work correctly

