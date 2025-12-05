# Subscription Integration Plan - Free & Pro Tiers

## Overview
This plan outlines the complete integration of Free and Pro subscription tiers with Stripe payments, promo codes, and feature gating throughout the application.

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

## Implementation Order

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

---

## Key Considerations

### Security
- Never expose Stripe secret key to client
- Validate all subscription checks server-side
- Verify webhook signatures
- Sanitize promo code inputs

### Performance
- Cache subscription status (with TTL)
- Batch usage tracking updates
- Optimize database queries with proper indexes

### User Experience
- Clear upgrade prompts
- Transparent pricing
- Easy cancellation
- Graceful feature degradation

### Business Logic
- Pro features unlock immediately after payment
- Free tier remains accessible after Pro cancellation
- Promo codes apply at checkout only
- Tournament credits roll over (max 12)

---

## Files to Create/Modify

### New Files (30+)
- Database models (3)
- Stripe utilities (3)
- Subscription utilities (3)
- Feature gating (2)
- API routes (15+)
- UI pages (5+)
- Admin pages (2)

### Modified Files (20+)
- User model
- Appeal system
- Tournament system
- Profile pages
- Settings pages
- Various feature components

---

## Estimated Timeline

- **Phase 1-2**: 2-3 days (Database + Stripe setup)
- **Phase 3-4**: 2-3 days (Signup flow + Admin)
- **Phase 5-6**: 4-5 days (Feature gating + Integration)
- **Phase 7-8**: 2-3 days (Management + Tracking)
- **Phase 9-10**: 2-3 days (UI/UX + Testing)

**Total: 12-17 days** (depending on complexity and testing)

---

## Next Steps

1. Review and approve this plan
2. Start with Phase 1 (Database schema)
3. Test Stripe connection (Phase 2.1)
4. Build incrementally, testing each phase
5. Deploy to staging for full integration testing

