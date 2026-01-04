# Coin Purchase System - Design & Economics

## Executive Summary

This document outlines the design for a coin purchase system that integrates with the existing Stripe payment infrastructure. Users will be able to purchase coins using real money, which can then be used for belt challenges, tournament entries, and other in-app activities.

---

## 1. Coin Economics & Pricing

### 1.1 Base Exchange Rate

**Recommended: 100 coins = $1.00 USD**

**Rationale:**
- Simple mental math (1 coin = 1 cent)
- Easy to understand for users
- Allows for granular pricing (e.g., 50 coins for a challenge)
- Competitive with similar gaming platforms

### 1.2 Coin Packages (with Bonus Incentives)

To encourage larger purchases, offer bonus coins:

| Package | Price | Base Coins | Bonus Coins | Total Coins | Bonus % | Value per $1 |
|---------|-------|------------|-------------|-------------|---------|--------------|
| Starter | $4.99 | 499 | 1 | 500 | 0.2% | 100.2 |
| Small | $9.99 | 999 | 25 | 1,024 | 2.5% | 102.5 |
| Medium | $19.99 | 1,999 | 100 | 2,099 | 5% | 105.0 |
| Large | $49.99 | 4,999 | 500 | 5,499 | 10% | 110.0 |
| XL | $99.99 | 9,999 | 1,500 | 11,499 | 15% | 115.0 |

**Alternative Simpler Pricing:**
- $5 = 500 coins
- $10 = 1,000 coins (+ 25 bonus = 1,025)
- $20 = 2,000 coins (+ 100 bonus = 2,100)
- $50 = 5,000 coins (+ 500 bonus = 5,500)
- $100 = 10,000 coins (+ 1,500 bonus = 11,500)

### 1.3 Coin Usage Costs (Reference)

Based on existing belt system:
- **Belt Challenge Entry Fee**: 50-500 coins (varies by belt value)
- **Tournament Belt Creation**: 1,000-5,000 coins
- **Tournament Entry**: 200-1,000 coins (if implemented)

---

## 2. System Architecture

### 2.1 Database Schema Additions

**Add to `CoinTransactionType` enum:**
```prisma
enum CoinTransactionType {
  // ... existing types ...
  COIN_PURCHASE        // User purchased coins with real money
  COIN_PURCHASE_REFUND // Refund for coin purchase
}
```

**Add to `CoinTransaction` model:**
```prisma
model CoinTransaction {
  // ... existing fields ...
  stripePaymentIntentId String? @map("stripe_payment_intent_id") // Link to Stripe payment
  stripeSessionId       String? @map("stripe_session_id")       // Link to checkout session
  packageName            String? @map("package_name")            // e.g., "Starter", "Large"
  baseAmount            Int?    @map("base_amount")             // Base coins purchased
  bonusAmount           Int?    @map("bonus_amount")             // Bonus coins given
}
```

### 2.2 Coin Package Configuration

**Store in `AdminSetting` table:**
- `COIN_PACKAGE_STARTER_PRICE`: "4.99"
- `COIN_PACKAGE_STARTER_BONUS`: "1"
- `COIN_PACKAGE_SMALL_PRICE`: "9.99"
- `COIN_PACKAGE_SMALL_BONUS`: "25"
- `COIN_PACKAGE_MEDIUM_PRICE`: "19.99"
- `COIN_PACKAGE_MEDIUM_BONUS`: "100"
- `COIN_PACKAGE_LARGE_PRICE`: "49.99"
- `COIN_PACKAGE_LARGE_BONUS`: "500"
- `COIN_PACKAGE_XL_PRICE`: "99.99"
- `COIN_PACKAGE_XL_BONUS`: "1500"

**Or create a `CoinPackage` table:**
```prisma
model CoinPackage {
  id          String   @id @default(uuid())
  name        String   // "Starter", "Small", "Medium", "Large", "XL"
  priceUSD    Decimal  @map("price_usd") @db.Decimal(10, 2)
  baseCoins   Int      @map("base_coins")
  bonusCoins  Int      @map("bonus_coins")
  totalCoins  Int      @map("total_coins") // baseCoins + bonusCoins
  isActive    Boolean  @default(true) @map("is_active")
  displayOrder Int     @default(0) @map("display_order")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
}
```

---

## 3. Purchase Flow

### 3.1 User Journey

1. **User needs coins** (e.g., wants to challenge a belt but has insufficient balance)
2. **Click "Buy Coins"** button → Navigate to `/coins/purchase`
3. **Select package** → See package options with bonuses highlighted
4. **Click "Purchase"** → Create Stripe Checkout Session
5. **Stripe Checkout** → User enters payment info
6. **Payment Success** → Webhook processes payment → Coins added to account
7. **Redirect to success page** → Show transaction summary

### 3.2 API Endpoints Needed

#### 3.2.1 `POST /api/coins/purchase/checkout`
**Purpose:** Create Stripe Checkout Session for coin purchase

**Request:**
```json
{
  "packageId": "uuid" // or "packageName": "Large"
}
```

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_...",
  "package": {
    "name": "Large",
    "priceUSD": 49.99,
    "totalCoins": 5500
  }
}
```

**Implementation:**
- Similar to `/api/advertiser/checkout` (one-time payment)
- Use `mode: 'payment'`
- Store `packageId` in metadata
- Success URL: `/coins/purchase/success?session_id={CHECKOUT_SESSION_ID}`
- Cancel URL: `/coins/purchase` (or previous page)

#### 3.2.2 `GET /api/coins/packages`
**Purpose:** Get available coin packages

**Response:**
```json
{
  "packages": [
    {
      "id": "uuid",
      "name": "Starter",
      "priceUSD": 4.99,
      "baseCoins": 499,
      "bonusCoins": 1,
      "totalCoins": 500,
      "bonusPercent": 0.2
    },
    // ... more packages
  ]
}
```

#### 3.2.3 `POST /api/webhooks/stripe` (Update)
**Purpose:** Handle Stripe webhook events for coin purchases

**New Event:** `checkout.session.completed`
- Check if `metadata.type === 'coin_purchase'`
- Extract `packageId` from metadata
- Call `addCoins()` with type `COIN_PURCHASE`
- Create `CoinTransaction` record with Stripe payment info

**Event:** `payment_intent.succeeded`
- Verify coin purchase was processed
- Update transaction status if needed

**Event:** `charge.refunded`
- Handle refunds: Deduct coins, create `COIN_PURCHASE_REFUND` transaction

---

## 4. UI Components

### 4.1 Coin Purchase Page (`/coins/purchase`)

**Features:**
- Display all available packages in a grid
- Highlight "Best Value" package (usually XL)
- Show current coin balance
- Show "Popular" badge on recommended package
- Mobile-responsive design

**Package Card:**
```
┌─────────────────────┐
│   LARGE PACKAGE     │
│   ⭐ POPULAR         │
│                     │
│   $49.99            │
│                     │
│   5,000 coins       │
│   + 500 bonus       │
│   = 5,500 total     │
│                     │
│   [Purchase]        │
└─────────────────────┘
```

### 4.2 Coin Balance Display

**Add to:**
- Top navigation bar (next to username)
- Belt challenge modal (show balance, "Buy More" link if insufficient)
- User profile page
- Belt room page

**Display Format:**
```
💰 1,250 coins
```

### 4.3 Purchase Success Page (`/coins/purchase/success`)

**Features:**
- Show transaction summary
- Display new coin balance
- "Continue to Belts" button
- Transaction history link

---

## 5. Integration Points

### 5.1 Belt Challenge Flow

**Current Issue:** `app/api/belts/challenge/route.ts` has TODO:
```typescript
// TODO: Deduct coins from challenger
// await deductCoins(session.userId, finalEntryFee)
```

**Fix:**
1. Check user's coin balance before creating challenge
2. If insufficient: Return error with `insufficientCoins: true` and `requiredCoins: finalEntryFee`
3. Frontend shows "Insufficient Coins" modal with "Buy Coins" button
4. After purchase, user can retry challenge

### 5.2 Tournament Belt Creation

**Current:** `lib/belts/tournament.ts` - `createTournamentBelt()` deducts coins
**Status:** ✅ Already implemented

### 5.3 Coin Balance Checks

**Add validation to:**
- Belt challenge creation
- Tournament belt creation
- Any future coin-based features

---

## 6. Security & Fraud Prevention

### 6.1 Payment Verification

- **Webhook Verification:** Always verify Stripe webhook signatures
- **Idempotency:** Use Stripe `idempotency_key` to prevent duplicate processing
- **Double-Spend Prevention:** Check if `stripePaymentIntentId` already processed

### 6.2 Rate Limiting

- Limit coin purchases per user per day (e.g., max $500/day)
- Flag suspicious patterns (e.g., multiple refunds)

### 6.3 Refund Handling

- If user requests refund: Deduct coins from balance
- If coins already spent: Handle gracefully (negative balance? or block refund?)
- **Recommendation:** Allow refund only if balance >= refund amount

---

## 7. Admin Features

### 7.1 Coin Package Management

**Admin Page:** `/admin/coins/packages`

**Features:**
- Create/edit/delete coin packages
- Set prices, base coins, bonus coins
- Enable/disable packages
- Reorder display order

### 7.2 Coin Transaction History

**Admin Page:** `/admin/coins/transactions`

**Features:**
- View all coin transactions
- Filter by user, type, date range
- Export to CSV
- Link to Stripe payment details

### 7.3 Manual Coin Grants/Deductions

**Already exists:** Admin can grant/deduct coins via API
**Enhancement:** Add UI in admin panel

---

## 8. Testing Checklist

### 8.1 Purchase Flow
- [ ] User can view coin packages
- [ ] User can select package and start checkout
- [ ] Stripe Checkout opens correctly
- [ ] Payment succeeds → coins added
- [ ] Payment fails → no coins added, error shown
- [ ] User cancels → no coins added

### 8.2 Webhook Processing
- [ ] `checkout.session.completed` adds coins correctly
- [ ] Duplicate webhooks don't add coins twice
- [ ] Refund webhook deducts coins correctly

### 8.3 Edge Cases
- [ ] User purchases while already in checkout (prevent double purchase)
- [ ] Network error during checkout
- [ ] Stripe webhook arrives before user returns to success page
- [ ] User has negative balance (shouldn't happen, but handle gracefully)

---

## 9. Implementation Priority

### Phase 1: Core Purchase System
1. ✅ Database schema updates (add `COIN_PURCHASE` type)
2. ✅ Coin package configuration (AdminSetting or CoinPackage table)
3. ✅ API: `POST /api/coins/purchase/checkout`
4. ✅ API: `GET /api/coins/packages`
5. ✅ Webhook: Handle `checkout.session.completed` for coin purchases
6. ✅ UI: Coin purchase page
7. ✅ UI: Coin balance display in nav/profile

### Phase 2: Integration
8. ✅ Fix belt challenge coin deduction
9. ✅ Add "Buy Coins" buttons where needed
10. ✅ Purchase success page
11. ✅ Transaction history page

### Phase 3: Admin & Polish
12. ✅ Admin: Coin package management
13. ✅ Admin: Transaction history
14. ✅ Analytics: Revenue tracking
15. ✅ Email receipts for purchases

---

## 10. Revenue Tracking

### 10.1 Metrics to Track

- Total revenue from coin sales
- Average purchase amount
- Most popular package
- Conversion rate (users who view packages vs. purchase)
- Refund rate

### 10.2 Stripe Dashboard

- Use Stripe's built-in analytics
- Tag all coin purchases with metadata: `type: 'coin_purchase'`
- Create Stripe report for coin sales

---

## 11. Future Enhancements

### 11.1 Subscription Coin Bonus
- PRO subscribers get 10% bonus on all coin purchases
- Or: PRO subscribers get monthly coin allowance (e.g., 1,000 coins/month)

### 11.2 Promo Codes
- "FIRST50" → 50% bonus on first purchase
- "WELCOME100" → 100 bonus coins on any purchase
- Integrate with existing promo code system

### 11.3 Gift Coins
- Users can gift coins to other users
- Requires separate payment flow

### 11.4 Coin Rewards
- Daily login bonus (10 coins)
- Win streak bonus (50 coins for 5 wins)
- Referral bonus (500 coins for each referral)

---

## 12. Code Review - Current Coin System

### 12.1 ✅ What Works

1. **Coin Transaction System:**
   - ✅ `CoinTransaction` model properly tracks all transactions
   - ✅ `addCoins()` and `deductCoins()` use database transactions (atomic)
   - ✅ Balance checking before deduction
   - ✅ Transaction history preserved

2. **Belt Challenge Economics:**
   - ✅ Entry fee calculation based on belt value
   - ✅ Winner/loser reward distribution
   - ✅ Platform fee tracking

3. **Tournament Integration:**
   - ✅ Tournament belt creation deducts coins
   - ✅ Belt staking in tournaments

### 12.2 ⚠️ Issues Found

1. **Belt Challenge Coin Deduction:**
   - ❌ `app/api/belts/challenge/route.ts` line 36-37: TODO comment, coins not actually deducted
   - **Fix:** Uncomment and implement `deductCoins()` call

2. **Missing Coin Purchase Type:**
   - ❌ `CoinTransactionType` enum doesn't have `COIN_PURCHASE`
   - **Fix:** Add to enum in schema

3. **No Coin Balance Display:**
   - ❌ Users can't see their coin balance easily
   - **Fix:** Add to profile API and UI components

4. **No Insufficient Balance Handling:**
   - ❌ No user-friendly error when coins insufficient
   - **Fix:** Return specific error, show "Buy Coins" button

### 12.3 🔧 Recommended Fixes

1. **Fix belt challenge coin deduction:**
```typescript
// In app/api/belts/challenge/route.ts
import { deductCoins } from '@/lib/belts/coin-economics'

// Before creating challenge:
const user = await prisma.user.findUnique({
  where: { id: session.userId },
  select: { coins: true }
})

if (user.coins < finalEntryFee) {
  return NextResponse.json({
    error: 'Insufficient coins',
    insufficientCoins: true,
    requiredCoins: finalEntryFee,
    currentBalance: user.coins
  }, { status: 400 })
}

// Deduct coins
await deductCoins(session.userId, finalEntryFee, {
  type: 'BELT_CHALLENGE_ENTRY',
  description: `Entry fee for ${belt.name} challenge`,
  beltId,
  beltChallengeId: challenge.id // Will be set after challenge creation
})
```

2. **Add coin balance to profile API:**
   - ✅ Already done: `app/api/profile/route.ts` includes `coins: true`

3. **Add coin purchase transaction type:**
   - Need migration to add `COIN_PURCHASE` and `COIN_PURCHASE_REFUND` to enum

---

## 13. Economics Validation

### 13.1 Cost Analysis

**Belt Challenge Example:**
- Entry fee: 100 coins = $1.00
- Winner gets: 70 coins (70% of pool)
- Loser gets: 20 coins (20% of pool)
- Platform fee: 10 coins (10% of pool)

**Revenue per Challenge:**
- Platform earns: 10 coins = $0.10 per challenge
- If 100 challenges/day: $10/day = $3,650/year

**Tournament Belt Creation:**
- Cost: 2,000 coins = $20.00
- One-time fee, goes to platform

### 13.2 User Acquisition Cost

**Free Coins for New Users:**
- Consider: Give 100 coins (worth $1) to new users
- Encourages first belt challenge
- Low cost, high engagement

### 13.3 Price Sensitivity

**Test Different Rates:**
- Start with 100 coins/$1
- Monitor purchase patterns
- Adjust if needed (e.g., 120 coins/$1 for better value perception)

---

## 14. Legal & Compliance

### 14.1 Terms of Service

- Coins are non-refundable (except for technical errors)
- Coins have no cash value
- Coins cannot be transferred between users (unless gift feature added)
- Platform reserves right to adjust coin prices

### 14.2 Tax Considerations

- Coin purchases are digital goods
- May need to collect sales tax based on user location
- Stripe Tax can handle this automatically

---

## 15. Next Steps

1. **Review this design** with stakeholders
2. **Approve pricing** (100 coins/$1 base rate)
3. **Create database migration** for new transaction types
4. **Implement purchase API** endpoints
5. **Build UI components** for coin purchase
6. **Fix belt challenge coin deduction**
7. **Test end-to-end** purchase flow
8. **Deploy to production**

---

## Summary

The coin purchase system will:
- ✅ Integrate seamlessly with existing Stripe infrastructure
- ✅ Use simple, competitive pricing (100 coins/$1)
- ✅ Offer bonus incentives for larger purchases
- ✅ Provide clear transaction history
- ✅ Support admin management
- ✅ Handle edge cases and fraud prevention

**Estimated Development Time:** 2-3 days for core implementation
