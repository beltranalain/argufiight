# Subscription & Advertising System - Complete Phase Plans

## Table of Contents
1. [Subscription Integration Plan](#subscription-integration-plan)
2. [Advertising System Implementation Plan](#advertising-system-implementation-plan)
3. [Quick Reference](#quick-reference)

---

# Subscription Integration Plan

## Overview
Complete integration of Free and Pro subscription tiers with Stripe payments, promo codes, and feature gating throughout the application.

---

## Phase 1: Database Schema Updates

### 1.1 New Models

#### `UserSubscription` Model
```prisma
model UserSubscription {
  id                    String   @id @default(uuid())
  userId                String   @unique @map("user_id")
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Subscription Details
  tier                  String   // FREE, PRO
  billingCycle          String?  // MONTHLY, YEARLY (null for FREE)
  status                String   // ACTIVE, CANCELLED, EXPIRED, PAST_DUE
  currentPeriodStart    DateTime? @map("current_period_start")
  currentPeriodEnd      DateTime? @map("current_period_end")
  
  // Stripe Integration
  stripeCustomerId      String?  @unique @map("stripe_customer_id")
  stripeSubscriptionId  String?  @unique @map("stripe_subscription_id")
  stripePriceId        String?  @map("stripe_price_id") // For monthly/yearly
  
  // Promo Code
  promoCodeId           String?  @map("promo_code_id")
  promoCode             PromoCode? @relation(fields: [promoCodeId], references: [id])
  
  // Cancellation
  cancelAtPeriodEnd     Boolean  @default(false) @map("cancel_at_period_end")
  cancelledAt           DateTime? @map("cancelled_at")
  
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")
  
  @@index([userId])
  @@index([status])
  @@index([tier])
  @@map("user_subscriptions")
}
```

#### `PromoCode` Model
```prisma
model PromoCode {
  id              String   @id @default(uuid())
  code            String   @unique // e.g., "WELCOME50"
  description     String?  @db.Text
  
  // Discount Type
  discountType    String   // PERCENTAGE, FIXED_AMOUNT
  discountValue   Decimal  @db.Decimal(10, 2) // 50 for 50% or 10.00 for $10 off
  
  // Usage Limits
  maxUses         Int?     @map("max_uses") // null = unlimited
  currentUses     Int      @default(0) @map("current_uses")
  
  // Time Limits
  validFrom       DateTime @map("valid_from")
  validUntil      DateTime? @map("valid_until") // null = no expiration
  
  // Applicability
  applicableTo    String   @default("PRO") // FREE, PRO, BOTH
  billingCycles   String?  @map("billing_cycles") // JSON: ["MONTHLY", "YEARLY"] or null for all
  
  // Status
  isActive        Boolean  @default(true) @map("is_active")
  
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  createdBy       String?   @map("created_by") // Admin user ID
  
  // Relations
  subscriptions   UserSubscription[]
  
  @@index([code])
  @@index([isActive])
  @@index([validUntil])
  @@map("promo_codes")
}
```

#### `UsageTracking` Model (for Pro features)
```prisma
model UsageTracking {
  id              String   @id @default(uuid())
  userId          String   @map("user_id")
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Feature Usage
  featureType     String   // APPEAL, TOURNAMENT_CREDIT, THATS_THE_ONE, SPEED_DEBATE
  count           Int      @default(0)
  
  // Period Tracking
  periodStart     DateTime @map("period_start")
  periodEnd       DateTime @map("period_end")
  periodType      String   @default("MONTHLY") // MONTHLY, YEARLY
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  @@unique([userId, featureType, periodStart])
  @@index([userId])
  @@index([featureType])
  @@index([periodStart])
  @@map("usage_tracking")
}
```

### 1.2 Update Existing Models

#### Update `User` Model
```prisma
model User {
  // ... existing fields ...
  
  // Subscription
  subscription    UserSubscription?
  
  // Usage Tracking
  usageTracking   UsageTracking[]
  
  // ... rest of relations ...
}
```

#### Update `AppealLimit` Model
```prisma
model AppealLimit {
  // ... existing fields ...
  
  // Remove subscriptionTier (now tracked in UserSubscription)
  // Keep monthlyLimit, currentCount, resetDate
}
```

---

## Phase 2: Stripe Integration & Testing

### 2.1 Stripe API Key Testing
**File:** `app/api/admin/settings/test-stripe/route.ts`

```typescript
// Test Stripe connection
export async function POST() {
  // 1. Get Stripe keys from AdminSetting
  // 2. Initialize Stripe client
  // 3. Test API call: stripe.customers.list({ limit: 1 })
  // 4. Return success/error
}
```

### 2.2 Stripe Helper Functions
**File:** `lib/stripe/stripe-client.ts`

```typescript
// Get Stripe keys from database
export async function getStripeKeys()
export async function createStripeClient()

// Customer management
export async function getOrCreateCustomer(userId, email)
export async function updateCustomer(userId, data)

// Subscription management
export async function createSubscription(customerId, priceId, promoCode?)
export async function cancelSubscription(subscriptionId, atPeriodEnd)
export async function updateSubscription(subscriptionId, newPriceId)
```

### 2.3 Stripe Webhook Handler
**File:** `app/api/webhooks/stripe/route.ts`

Handle events:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.trial_will_end`

---

## Phase 3: Signup Flow Enhancement

### 3.1 Post-Signup Tier Selection
**File:** `app/(auth)/signup/select-tier/page.tsx`

**Flow:**
1. After successful signup → redirect to `/signup/select-tier`
2. Display Free vs Pro comparison
3. User selects:
   - **Free**: Create UserSubscription with tier=FREE, status=ACTIVE
   - **Pro**: Redirect to `/signup/payment?tier=PRO&cycle=MONTHLY`

### 3.2 Payment Page
**File:** `app/(auth)/signup/payment/page.tsx`

**Features:**
- Monthly ($9.99) vs Yearly ($89) toggle
- Promo code input field
- Stripe Elements for card input
- Real-time promo code validation
- Display final price after discount
- "Subscribe" button → Create Stripe Checkout Session

### 3.3 Stripe Checkout Session
**File:** `app/api/subscriptions/checkout/route.ts`

```typescript
// Create Stripe Checkout Session
// Include:
// - Customer email
// - Price ID (monthly or yearly)
// - Promo code (if provided)
// - Success URL: /signup/success?session_id={CHECKOUT_SESSION_ID}
// - Cancel URL: /signup/select-tier
```

### 3.4 Success Page
**File:** `app/(auth)/signup/success/page.tsx`

- Verify Stripe session
- Create UserSubscription record
- Initialize usage tracking
- Redirect to dashboard

---

## Phase 4: Admin Dashboard - Promo Code Management

### 4.1 Promo Codes Page
**File:** `app/admin/subscriptions/promo-codes/page.tsx`

**Features:**
- List all promo codes (active/inactive)
- Create new promo code form:
  - Code name (unique)
  - Description
  - Discount type (Percentage/Fixed)
  - Discount value
  - Max uses (unlimited option)
  - Valid from/to dates
  - Applicable to (FREE/PRO/BOTH)
  - Billing cycles (MONTHLY/YEARLY/BOTH)
- Edit existing codes
- View usage statistics
- Activate/deactivate codes

### 4.2 Promo Code API
**File:** `app/api/admin/promo-codes/route.ts`

- GET: List all promo codes
- POST: Create new promo code
- PATCH: Update promo code
- DELETE: Soft delete (set isActive=false)

**File:** `app/api/admin/promo-codes/[id]/route.ts`

- GET: Get specific promo code
- PATCH: Update promo code
- DELETE: Delete promo code

### 4.3 Promo Code Validation API
**File:** `app/api/subscriptions/validate-promo-code/route.ts`

```typescript
// Validate promo code
// Check:
// - Code exists and is active
// - Not expired
// - Not exceeded max uses
// - Applicable to tier/billing cycle
// Return: discount amount, final price
```

---

## Phase 5: Feature Gating System

### 5.1 Subscription Utility Functions
**File:** `lib/subscriptions/subscription-utils.ts`

```typescript
// Get user's subscription
export async function getUserSubscription(userId)

// Check if user has feature access
export async function hasFeatureAccess(userId, feature: string)

// Get feature limits
export async function getFeatureLimit(userId, feature: string)

// Check usage against limit
export async function canUseFeature(userId, feature: string)

// Increment usage
export async function recordFeatureUsage(userId, feature: string)
```

### 5.2 Feature Constants
**File:** `lib/subscriptions/features.ts`

```typescript
export const FEATURES = {
  // Free Tier
  STANDARD_DEBATES: 'standard_debates',
  CREATE_CHALLENGES: 'create_challenges',
  AI_JUDGES: 'ai_judges',
  ELO_RANKING: 'elo_ranking',
  WATCH_DEBATES: 'watch_debates',
  BASIC_STATS: 'basic_stats',
  FREE_TOURNAMENTS: 'free_tournaments',
  THATS_THE_ONE: 'thats_the_one', // 10/month
  
  // Pro Tier Only
  SPEED_DEBATES: 'speed_debates',
  PRIORITY_MATCHMAKING: 'priority_matchmaking',
  FAST_TRACK_TOURNAMENTS: 'fast_track_tournaments',
  PERFORMANCE_DASHBOARD: 'performance_dashboard',
  ARGUMENT_QUALITY_SCORES: 'argument_quality_scores',
  JUDGE_PREFERENCE_ANALYSIS: 'judge_preference_analysis',
  OPPONENT_ANALYSIS: 'opponent_analysis',
  HISTORICAL_ELO_CHARTS: 'historical_elo_charts',
  TOURNAMENT_CREDITS: 'tournament_credits', // 4/month
  PRO_TOURNAMENTS: 'pro_tournaments',
  CUSTOM_TOURNAMENTS: 'custom_tournaments',
  APPEALS: 'appeals', // 12/month (vs 4 for free)
  APPEAL_SUCCESS_TRACKING: 'appeal_success_tracking',
  BONUS_APPEAL_CREDITS: 'bonus_appeal_credits',
  THATS_THE_ONE_UNLIMITED: 'thats_the_one_unlimited',
  DEBATE_REPLAY_EXPORT: 'debate_replay_export',
  HIGHLIGHT_REELS: 'highlight_reels',
  CUSTOM_PROFILE_THEMES: 'custom_profile_themes',
  VERIFIED_BADGE: 'verified_badge',
  EARLY_ACCESS: 'early_access',
  NO_ADS: 'no_ads',
}

export const FEATURE_LIMITS = {
  FREE: {
    APPEALS: 4,
    THATS_THE_ONE: 10,
    TOURNAMENT_CREDITS: 0,
  },
  PRO: {
    APPEALS: 12,
    THATS_THE_ONE: -1, // unlimited
    TOURNAMENT_CREDITS: 4, // per month, max 12 rollover
  },
}
```

### 5.3 Feature Gating Middleware
**File:** `lib/subscriptions/feature-gate.ts`

```typescript
// Middleware to check feature access
export async function requireFeature(userId, feature: string)
export async function checkFeatureAccess(userId, feature: string)
```

---

## Phase 6: Integration Points

### 6.1 Appeals System
**Files to Update:**
- `app/api/debates/[id]/appeal/route.ts`
- `components/debate/AppealButton.tsx`

**Changes:**
- Check subscription tier before allowing appeal
- Use `canUseFeature(userId, 'appeals')`
- Increment usage on successful appeal
- Show different limits for Free (4) vs Pro (12)

### 6.2 "That's The One" Feature
**Files to Update:**
- `app/api/debates/[id]/mark-best-argument/route.ts` (if exists)
- Any component that marks best arguments

**Changes:**
- Free: Limit to 10/month
- Pro: Unlimited
- Track usage in UsageTracking

### 6.3 Tournament Credits
**Files to Update:**
- Tournament creation/entry logic

**Changes:**
- Pro users get 4 credits/month
- Credits roll over (max 12)
- Track in UsageTracking
- Free users: 0 credits (can only join free tournaments)

### 6.4 Speed Mode Debates
**Files to Update:**
- Debate creation flow
- `app/api/debates/route.ts`

**Changes:**
- Check `hasFeatureAccess(userId, 'speed_debates')`
- Only Pro users can create speed mode debates
- Show upgrade prompt for Free users

### 6.5 Analytics & Dashboard
**Files to Update:**
- Profile pages
- Analytics pages

**Changes:**
- Show basic stats for Free
- Show advanced analytics for Pro
- Gate access to:
  - Performance dashboard
  - Argument quality scores
  - Judge preference analysis
  - Opponent analysis
  - Historical ELO charts

### 6.6 Profile Features
**Files to Update:**
- Profile settings
- Profile display

**Changes:**
- Custom themes: Pro only
- Verified badge: Pro only
- Custom banner: Pro only

---

## Phase 7: Subscription Management

### 7.1 User Subscription Page
**File:** `app/(dashboard)/settings/subscription/page.tsx`

**Features:**
- Display current tier
- Show subscription status
- Upgrade/downgrade options
- Cancel subscription
- View billing history
- Update payment method
- View promo codes used

### 7.2 Subscription API
**File:** `app/api/subscriptions/route.ts`

- GET: Get user's subscription
- POST: Create subscription (from payment)
- PATCH: Update subscription (upgrade/downgrade)

**File:** `app/api/subscriptions/cancel/route.ts`

- POST: Cancel subscription (at period end or immediately)

**File:** `app/api/subscriptions/upgrade/route.ts`

- POST: Upgrade from Free to Pro

**File:** `app/api/subscriptions/downgrade/route.ts`

- POST: Downgrade from Pro to Free (at period end)

---

## Phase 8: Usage Tracking & Limits

### 8.1 Usage Tracking API
**File:** `app/api/subscriptions/usage/route.ts`

- GET: Get current usage for all features
- POST: Record feature usage (internal)

### 8.2 Monthly Reset Job
**File:** `app/api/cron/reset-usage/route.ts` (or use Vercel Cron)

- Reset monthly usage counters
- Roll over tournament credits (max 12)
- Reset appeal counts
- Reset "That's The One" counts

---

## Phase 9: UI/UX Enhancements

### 9.1 Upgrade Prompts
- Show upgrade prompts when Free users try Pro features
- Modal: "Upgrade to Pro to unlock this feature"
- Link to subscription page

### 9.2 Tier Badges
- Display tier badge on profile
- Show "Pro" badge for Pro users
- Show verified checkmark for Pro users

### 9.3 Feature Comparison
- Add comparison table on signup
- Show on subscription settings page
- Highlight Pro features throughout app

---

## Phase 10: Testing Checklist

### 10.1 Stripe Integration
- [ ] Test Stripe API key connection
- [ ] Test creating customer
- [ ] Test creating subscription
- [ ] Test applying promo code
- [ ] Test webhook events
- [ ] Test payment success flow
- [ ] Test payment failure handling

### 10.2 Subscription Flow
- [ ] Test Free tier selection
- [ ] Test Pro tier selection (monthly)
- [ ] Test Pro tier selection (yearly)
- [ ] Test promo code application
- [ ] Test invalid promo code
- [ ] Test expired promo code
- [ ] Test max uses promo code

### 10.3 Feature Gating
- [ ] Test Free user limits (appeals, "That's The One")
- [ ] Test Pro user unlimited features
- [ ] Test upgrade prompts
- [ ] Test feature access checks

### 10.4 Usage Tracking
- [ ] Test appeal usage tracking
- [ ] Test "That's The One" usage tracking
- [ ] Test tournament credit tracking
- [ ] Test monthly reset

### 10.5 Admin Features
- [ ] Test creating promo codes
- [ ] Test editing promo codes
- [ ] Test deactivating promo codes
- [ ] Test viewing usage statistics

---

## Subscription Implementation Order

1. **Phase 1**: Database schema updates (migration)
2. **Phase 2**: Stripe integration & testing
3. **Phase 4**: Admin promo code management (needed for testing)
4. **Phase 3**: Signup flow enhancement
5. **Phase 5**: Feature gating system
6. **Phase 6**: Integration points (one feature at a time)
7. **Phase 7**: Subscription management
8. **Phase 8**: Usage tracking
9. **Phase 9**: UI/UX enhancements
10. **Phase 10**: Testing

**Estimated Timeline:** 12-17 days

---

# Advertising System Implementation Plan

## Executive Summary

This plan implements a comprehensive dual-revenue advertising system from scratch: **Platform Ads** (traditional admin-managed campaigns) + **Creator Marketplace** (user-to-advertiser sponsorships). Both systems will be built new with clean architecture, configurable settings, and admin toggles for easy enable/disable.

---

## Current System Analysis

### What You Have Now ✅

**Database:**
- `Advertisement` model (basic)
  - Fields: title, type, creativeUrl, targetUrl, status, dates, category, impressions, clicks
  - Status: DRAFT, ACTIVE, PAUSED
  - Types: BANNER, SPONSORED_DEBATE, IN_FEED

**Admin Features:**
- `/admin/advertisements` page exists
- CRUD operations for ads
- Image upload (Vercel Blob Storage)
- Basic scheduling (start/end dates)
- Category targeting
- **Note:** Ads are NOT displayed on site yet (as per requirements)

**API:**
- `GET /api/admin/advertisements` - List ads
- `POST /api/admin/advertisements` - Create ad
- `PUT /api/admin/advertisements/[id]` - Update ad
- `DELETE /api/admin/advertisements/[id]` - Delete ad

### What's Missing ❌

1. **Advertiser Management** - No advertiser accounts, approval workflow
2. **Ad Display System** - Ads not rendered anywhere
3. **Tracking** - Impressions/clicks tracked but not implemented
4. **Creator Marketplace** - No user-to-advertiser system
5. **Payment Integration** - No Stripe Connect, escrow, payouts
6. **Campaign System** - Current ads are too simple, need campaigns
7. **Offer/Contract System** - No creator sponsorship workflow

---

## Integration Strategy

**Decision: Build Both Systems New** ✅

**Approach:**
- Build Platform Ads system from scratch
- Build Creator Marketplace system from scratch
- Clean architecture, no legacy constraints
- Both systems controlled by admin toggles
- Can be enabled/disabled independently
- All configuration stored in `AdminSetting` table

---

## Proposed Architecture

### Two-Tier System

```
┌─────────────────────────────────────────────────────────┐
│              ADVERTISING SYSTEM                         │
│                                                         │
│  ┌──────────────────┐    ┌──────────────────┐         │
│  │  PLATFORM ADS    │    │ CREATOR MARKET   │         │
│  │  (Traditional)   │    │ (User Sponsors)  │         │
│  └────────┬─────────┘    └────────┬─────────┘         │
│           │                        │                    │
│           ▼                        ▼                    │
│  ┌──────────────────────────────────────────┐         │
│  │      UNIFIED AD DISPLAY ENGINE            │         │
│  │  • Profile Banners                        │         │
│  │  • Post-Debate Ads                        │         │
│  │  • Sidebar Widgets                        │         │
│  │  • In-Feed Ads                            │         │
│  └──────────────────────────────────────────┘         │
│                                                         │
│  ┌──────────────────────────────────────────┐         │
│  │      UNIFIED TRACKING SYSTEM               │         │
│  │  • Impressions (deduplicated)              │         │
│  │  • Clicks                                   │         │
│  │  • Analytics                                │         │
│  └──────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

---

## Database Schema Evolution

### Phase 1: New Database Models

**Note:** Building both systems new, not extending existing `Advertisement` model.

**New Models:**
- `Advertiser` - Advertiser accounts with approval workflow
- `Campaign` - Campaigns (Platform Ads or Creator Sponsorship)
- `Offer` - Offers from advertisers to creators
- `AdContract` - Signed contracts between advertisers and creators
- `Impression` - Detailed impression tracking
- `Click` - Detailed click tracking
- `CreatorTaxInfo` - Tax information for creators (1099)
- Update `User` model with creator fields

---

## Implementation Phases

### **PHASE 1: Foundation & Database (3-4 days)**

**1.1 Database Migration Strategy**
- **Approach:** Build new models from scratch
- **Steps:**
  1. Create all new models (Advertiser, Campaign, Offer, AdContract, etc.)
  2. Add creator fields to existing `User` model
  3. Create migration with all new tables
  4. Add indexes for performance
  5. Add admin settings for toggles and configuration

**1.2 Admin Settings Configuration**
- Add toggles in `AdminSetting` table:
  - `ADS_PLATFORM_ENABLED` (boolean, default: false)
  - `ADS_CREATOR_MARKETPLACE_ENABLED` (boolean, default: false)
- Add creator eligibility settings:
  - `CREATOR_MIN_ELO` (default: 1500)
  - `CREATOR_MIN_DEBATES` (default: 10)
  - `CREATOR_MIN_ACCOUNT_AGE_MONTHS` (default: 3)
- Add platform fee settings:
  - `CREATOR_FEE_BRONZE` (default: 25)
  - `CREATOR_FEE_SILVER` (default: 20)
  - `CREATOR_FEE_GOLD` (default: 15)
  - `CREATOR_FEE_PLATINUM` (default: 10)

**1.3 Stripe Connect Setup**
- Already have Stripe integration for subscriptions
- Extend `lib/stripe/stripe-client.ts` with Connect functions
- Add Connect-specific helpers in `lib/stripe/connect.ts`

**1.4 File Storage**
- Already using Vercel Blob Storage
- Can reuse existing upload utilities
- Organize by advertiser/campaign folders

**Key Files:**
- `prisma/schema.prisma` - Add all new models
- `lib/stripe/connect.ts` - Stripe Connect functions
- `lib/ads/helpers.ts` - Fee calculations, eligibility (reads from AdminSetting)
- `lib/ads/config.ts` - Read admin settings for toggles and config

**Deliverables:**
- ✅ Database migration (all new models)
- ✅ Admin settings for toggles and configuration
- ✅ Stripe Connect integration
- ✅ Helper functions (configurable)

---

### **PHASE 2: Admin Dashboard Enhancement (4-5 days)**

**2.1 Reorganize Admin Ads Page**

**Current:** Single page for all ads

**New Structure:**
```
Admin Dashboard
├── Platform Ads Tab (existing, enhanced)
│   ├── Traditional banner ads
│   ├── Admin-created campaigns
│   └── Platform-wide ads
│
└── Creator Marketplace Tab (NEW)
    ├── Advertiser Applications Queue
    ├── Campaign Review Queue
    ├── Active Contracts Monitor
    └── Marketplace Statistics
```

**2.2 Admin Settings Integration**
- Add advertising section to `/admin/settings` page
- Toggles for both ad systems
- Creator eligibility configuration
- Platform fee configuration
- All stored in `AdminSetting` table

**2.3 New Creator Marketplace Tab**
- Advertiser approval queue
- Campaign review queue
- Active contracts dashboard
- Revenue statistics

**Key Files:**
- `app/admin/advertisements/page.tsx` - Enhance existing
- `app/admin/marketplace/page.tsx` - New marketplace tab
- `components/admin/PlatformAdsTab.tsx` - Refactored
- `components/admin/CreatorMarketplaceTab.tsx` - New

**Deliverables:**
- ✅ Enhanced Platform Ads tab
- ✅ New Creator Marketplace tab
- ✅ Approval workflows
- ✅ Admin API routes

---

### **PHASE 3: Advertiser Dashboard (5-7 days)**

**3.1 Advertiser Application Flow**
- Public landing page: `/advertise`
- Application form
- Status tracking: `/advertise/pending`
- Email notifications

**3.2 Advertiser Dashboard**
- Campaign management
- Creator discovery
- Offer management
- Analytics dashboard
- Billing & payments

**3.3 Campaign Creation Wizard**
- Multi-step form
- Creative upload
- Targeting options
- Budget setting
- Review & submit

**Key Files:**
- `app/advertise/page.tsx` - Landing & application
- `app/advertiser/dashboard/page.tsx` - Main dashboard
- `app/advertiser/campaigns/create/page.tsx` - Wizard
- `app/api/advertisers/apply/route.ts` - Application API

**Deliverables:**
- ✅ Advertiser signup flow
- ✅ Advertiser dashboard
- ✅ Campaign creation wizard
- ✅ Creator discovery interface

---

### **PHASE 4: Creator Features (4-6 days)**

**4.1 Creator Onboarding**
- "Become a Creator" CTA in profile
- Eligibility checker
- Stripe Connect onboarding
- Tax form collection (W-9)
- Bank account verification

**4.2 Creator Dashboard**
- Earnings overview
- Active contracts
- Offer inbox
- Ad slot management
- Creator stats for advertisers

**4.3 Offer Management**
- Incoming offers list
- Accept/decline/counter interface
- Negotiation (max 3 rounds)
- Contract signing

**Key Files:**
- `components/profile/CreatorCTA.tsx` - Profile CTA
- `app/creator/dashboard/page.tsx` - Creator dashboard
- `app/creator/setup/page.tsx` - Stripe onboarding
- `components/creator/OfferInbox.tsx` - Offer management

**Deliverables:**
- ✅ Creator onboarding flow
- ✅ Creator dashboard
- ✅ Offer management system
- ✅ Stripe Connect integration

---

### **PHASE 5: Ad Display System (3-5 days)**

**5.1 Ad Display Components**

**Unified Ad Component:**
```typescript
<AdDisplay 
  placement="PROFILE_BANNER"
  userId={userId}
  context="profile"
/>
```

**Placements:**
1. **Profile Banner** - Top of user profile
2. **Post-Debate Ad** - After debate victory
3. **Debate Widget** - Sidebar during live debates
4. **In-Feed** - Between trending topics
5. **Leaderboard Sponsored** - Sponsored leaderboard entry

**5.2 Ad Selection Logic**
```typescript
// Check if ads are enabled (from AdminSetting)
const platformAdsEnabled = await getAdminSetting('ADS_PLATFORM_ENABLED') === 'true'
const creatorMarketplaceEnabled = await getAdminSetting('ADS_CREATOR_MARKETPLACE_ENABLED') === 'true'

// If both disabled, return null (no ads shown)
if (!platformAdsEnabled && !creatorMarketplaceEnabled) {
  return null
}

// Priority order (only if enabled):
// 1. Active creator contract ads (highest priority) - if creator marketplace enabled
// 2. Active platform ads (admin-created) - if platform ads enabled
// 3. Fallback/default ads - if platform ads enabled
```

**5.3 Integration Points**
- Profile pages: Add `<ProfileBanner userId={userId} />`
- Debate victory screen: Add `<PostDebateAd creatorId={winnerId} />`
- Dashboard sidebar: Add `<AdWidget placement="SIDEBAR" />`
- Trending topics: Add `<InFeedAd />` between items

**Key Files:**
- `components/ads/AdDisplay.tsx` - Unified component
- `components/ads/ProfileBanner.tsx` - Profile placement
- `components/ads/PostDebateAd.tsx` - Post-debate placement
- `lib/ads/ad-selector.ts` - Ad selection logic
- `app/api/ads/select/route.ts` - Ad selection API

**Deliverables:**
- ✅ Ad display components
- ✅ Integration with existing UI
- ✅ Ad selection algorithm
- ✅ "Sponsored" labels

---

### **PHASE 6: Tracking & Analytics (3-4 days)**

**6.1 Impression Tracking**
- Client-side: Track when ad enters viewport
- Server-side: Deduplicate by IP + contract + time window
- Prevent double-counting (same user, same ad, 1 hour window)

**6.2 Click Tracking**
- Track clicks with UTM parameters
- Link to contract for creator marketplace
- Link to campaign for platform ads

**6.3 Analytics Dashboard**
- Real-time stats for advertisers
- Earnings dashboard for creators
- Admin revenue overview
- Performance charts

**Key Files:**
- `app/api/ads/track/impression/route.ts` - Impression tracking
- `app/api/ads/track/click/route.ts` - Click tracking
- `lib/ads/tracking.ts` - Tracking utilities
- `components/ads/AdTracker.tsx` - Client-side tracker

**Deliverables:**
- ✅ Impression tracking (deduplicated)
- ✅ Click tracking
- ✅ Analytics dashboards
- ✅ Performance reports

---

### **PHASE 7: Payment & Escrow (3-4 days)**

**7.1 Contract Creation Flow**
1. Creator accepts offer
2. Calculate platform fee (based on creator tier)
3. Charge advertiser via Stripe
4. Hold funds in escrow
5. Create contract record
6. Send notifications

**7.2 Campaign Completion & Payout**
- Daily cron job checks completed contracts
- Verify requirements met (minimum impressions, etc.)
- Release escrow to creator (minus platform fee)
- Update creator earnings (for 1099)
- Send payout notifications

**7.3 Dispute Handling**
- Contract cancellation workflow
- Refund logic (partial/full)
- Admin dispute resolution

**Key Files:**
- `app/api/offers/[id]/accept/route.ts` - Contract creation
- `app/api/cron/process-ad-payouts/route.ts` - Daily payout job
- `lib/stripe/connect.ts` - Escrow & payout functions
- `app/api/contracts/[id]/dispute/route.ts` - Dispute handling

**Deliverables:**
- ✅ Escrow system
- ✅ Automatic payouts
- ✅ Tax tracking (1099 data)
- ✅ Dispute handling

---

### **PHASE 8: Testing & Launch (3-5 days)**

**8.1 Testing Checklist**
- Admin workflows
- Advertiser flows
- Creator flows
- Ad display & tracking
- Payment processing
- Edge cases

**8.2 Launch Strategy**
- Soft launch (invite-only)
- Limited launch (approved users)
- Full launch (public)

---

## Key Decisions - FINALIZED ✅

1. **Ad Model Strategy:** ✅ **BUILD BOTH NEW**
   - Both Platform Ads and Creator Marketplace will be built from scratch
   - Clean architecture, no legacy constraints
   - New models: `Campaign`, `Advertiser`, `Offer`, `AdContract`, etc.

2. **Creator Eligibility:** ✅ **USE GUIDE REQUIREMENTS + CONFIGURABLE**
   - Default: 1500+ ELO, 10+ debates, 3+ months account age
   - Admin can edit/adjust requirements in settings
   - Stored in `AdminSetting` table for easy updates

3. **Platform Fee:** ✅ **FULLY CONFIGURABLE**
   - Admin can set fees for each creator tier (BRONZE, SILVER, GOLD, PLATINUM)
   - Stored in `AdminSetting` table
   - Default: BRONZE 25%, SILVER 20%, GOLD 15%, PLATINUM 10%
   - Can be adjusted anytime without code changes

4. **Ad Placement Priority:** ✅ **CLARIFIED**
   - **Technical Priority:** When multiple ads compete for same slot, use priority queue (creator contracts > platform ads > fallback)
   - **Disputes/Conflicts:** All disputes go to Support Management page (existing support ticket system)
   - Support tickets can be created for:
     - Contract disputes
     - Payment issues
     - Ad performance complaints
     - Creator/advertiser conflicts

5. **Ad System Toggles:** ✅ **ENABLE/DISABLE SEPARATELY**
   - Admin toggle: "Enable Platform Ads" (on/off)
   - Admin toggle: "Enable Creator Marketplace" (on/off)
   - Stored in `AdminSetting` table
   - When disabled, ads don't display and features are hidden
   - Allows gradual rollout and easy maintenance

---

## Advertising Implementation Order

### Week 1-2: Foundation
1. Database migration (additive, backward compatible)
2. Stripe Connect setup
3. Admin dashboard enhancement
4. Basic advertiser application flow

### Week 3-4: Core Features
5. Advertiser dashboard
6. Campaign creation
7. Creator onboarding
8. Offer system

### Week 5-6: Display & Tracking
9. Ad display components
10. Integration with existing UI
11. Tracking system
12. Analytics dashboards

### Week 7-8: Payments & Polish
13. Escrow & payout system
14. Testing & bug fixes
15. Documentation
16. Soft launch

**Realistic Timeline:** 6-8 weeks (1.5-2 months)

---

## Quick Reference

### Subscription System
- **Phases:** 10 phases
- **Timeline:** 12-17 days
- **Key Features:** Free/Pro tiers, Stripe payments, promo codes, feature gating
- **Files:** See Phase-by-phase breakdown above

### Advertising System
- **Phases:** 8 phases
- **Timeline:** 6-8 weeks
- **Key Features:** Platform Ads + Creator Marketplace, Stripe Connect, escrow, payouts
- **Files:** See Phase-by-phase breakdown above

### Admin Settings (Both Systems)
All configuration stored in `AdminSetting` table:
- Subscription: Promo codes, feature limits
- Advertising: Toggles, eligibility, platform fees

---

## Next Steps

1. **Review both plans** - Confirm approach and priorities
2. **Decide on timeline** - Adjust phases if needed
3. **Set up development environment** - Stripe test mode, etc.
4. **Start Phase 1** - Database migration for chosen system
5. **Iterate** - Build, test, refine

---

**Both plans are ready for implementation!** 🚀

