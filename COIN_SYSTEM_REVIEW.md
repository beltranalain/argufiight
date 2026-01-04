# Coin System Review & Status

## Current Implementation Status

### ✅ What's Working

1. **Database Schema:**
   - ✅ `User.coins` field exists (Int, default 0)
   - ✅ `CoinTransaction` model properly tracks all transactions
   - ✅ Transaction types: `BELT_CHALLENGE_ENTRY`, `BELT_CHALLENGE_REWARD`, `BELT_CHALLENGE_CONSOLATION`, `BELT_TOURNAMENT_CREATION`, `ADMIN_GRANT`, `ADMIN_DEDUCT`, `REFUND`
   - ✅ Transaction statuses: `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`

2. **Core Functions:**
   - ✅ `addCoins()` - Properly adds coins with transaction record
   - ✅ `deductCoins()` - Checks balance, deducts coins atomically
   - ✅ `calculateChallengeEntryFee()` - Calculates entry fee based on belt value
   - ✅ `calculateChallengeRewards()` - Calculates winner/loser rewards
   - ✅ `processBeltChallengeCoins()` - Processes rewards after challenge completion

3. **Integration Points:**
   - ✅ Tournament belt creation deducts coins (`lib/belts/tournament.ts`)
   - ✅ Belt challenge creation deducts coins (`lib/belts/core.ts` line 286)
   - ✅ Profile API includes coin balance (`app/api/profile/route.ts`)

### ⚠️ Issues Found

1. **Belt Challenge API Route:**
   - **Location:** `app/api/belts/challenge/route.ts` line 36-37
   - **Issue:** TODO comment - coins not actually deducted in API route
   - **Status:** The `createBeltChallenge()` function in `lib/belts/core.ts` DOES deduct coins (line 286), so this might be redundant
   - **Action:** Verify if `createBeltChallenge()` handles deduction, or if API route needs to do it

2. **Missing Coin Purchase Transaction Type:**
   - **Issue:** `CoinTransactionType` enum doesn't include `COIN_PURCHASE` or `COIN_PURCHASE_REFUND`
   - **Impact:** Can't track coin purchases when implemented
   - **Action:** Add to enum in schema migration

3. **No Coin Balance UI:**
   - **Issue:** Users can't easily see their coin balance
   - **Status:** API returns coins, but UI doesn't display it prominently
   - **Action:** Add coin balance to navigation/profile

4. **No Insufficient Balance Handling:**
   - **Issue:** When user lacks coins, error message isn't user-friendly
   - **Action:** Return specific error with "Buy Coins" link

### 🔍 Code Analysis

**Belt Challenge Flow:**
```typescript
// lib/belts/core.ts - createBeltChallenge()
// Line 286: DOES deduct coins
await deductCoins(challengerId, entryFee, {
  type: 'BELT_CHALLENGE_ENTRY',
  // ...
})

// app/api/belts/challenge/route.ts
// Line 36-37: Has TODO comment
// TODO: Deduct coins from challenger
// await deductCoins(session.userId, finalEntryFee)
```

**Conclusion:** The `createBeltChallenge()` function already deducts coins, so the TODO in the API route is likely outdated. However, it would be better to check balance BEFORE creating the challenge to provide better error handling.

---

## Recommended Fixes (Before Purchase System)

### Fix 1: Add Balance Check Before Challenge

**File:** `app/api/belts/challenge/route.ts`

```typescript
// After calculating finalEntryFee, before creating challenge:
const user = await prisma.user.findUnique({
  where: { id: session.userId },
  select: { coins: true }
})

if (!user) {
  return NextResponse.json({ error: 'User not found' }, { status: 404 })
}

if (user.coins < finalEntryFee) {
  return NextResponse.json({
    error: 'Insufficient coins',
    insufficientCoins: true,
    requiredCoins: finalEntryFee,
    currentBalance: user.coins,
    shortfall: finalEntryFee - user.coins
  }, { status: 400 })
}

// Then create challenge (which will deduct coins)
const challenge = await createBeltChallenge(beltId, session.userId, finalEntryFee)
```

### Fix 2: Add Coin Purchase Transaction Types

**Migration needed:**
```sql
ALTER TYPE "CoinTransactionType" ADD VALUE 'COIN_PURCHASE';
ALTER TYPE "CoinTransactionType" ADD VALUE 'COIN_PURCHASE_REFUND';
```

### Fix 3: Add Coin Balance to UI

**Locations:**
- Top navigation bar
- User profile page
- Belt challenge modal (show balance, "Buy More" if insufficient)

---

## Economics Summary

### Recommended Pricing: **100 coins = $1.00 USD**

**Rationale:**
- Simple: 1 coin = 1 cent
- Easy mental math
- Competitive with gaming platforms
- Allows granular pricing (50 coins for small challenge)

### Coin Packages (with Bonuses):

| Package | Price | Base | Bonus | Total | Bonus % |
|---------|-------|------|-------|-------|---------|
| Starter | $4.99 | 499 | 1 | 500 | 0.2% |
| Small | $9.99 | 999 | 25 | 1,024 | 2.5% |
| Medium | $19.99 | 1,999 | 100 | 2,099 | 5% |
| Large | $49.99 | 4,999 | 500 | 5,499 | 10% |
| XL | $99.99 | 9,999 | 1,500 | 11,499 | 15% |

**Value increases with larger purchases** - encourages bigger purchases.

---

## Purchase Flow Design

### User Journey:
1. User needs coins → Click "Buy Coins"
2. Select package → See bonuses highlighted
3. Stripe Checkout → Enter payment
4. Payment success → Webhook adds coins
5. Redirect to success page → Show new balance

### API Endpoints Needed:
- `POST /api/coins/purchase/checkout` - Create Stripe session
- `GET /api/coins/packages` - Get available packages
- Update `POST /api/webhooks/stripe` - Handle coin purchase webhooks

### Database Changes:
- Add `COIN_PURCHASE` and `COIN_PURCHASE_REFUND` to enum
- Add `stripePaymentIntentId`, `stripeSessionId`, `packageName`, `baseAmount`, `bonusAmount` to `CoinTransaction` model
- Create `CoinPackage` table (or use AdminSetting)

---

## Next Steps

1. **Review design document** (`COIN_PURCHASE_SYSTEM_DESIGN.md`)
2. **Approve pricing** (100 coins/$1)
3. **Fix current issues** (balance check, transaction types)
4. **Implement purchase system** (when ready to build)

---

## Current Coin Usage

**Belt Challenges:**
- Entry fee: 50-500 coins (varies by belt value)
- Winner reward: 70% of pool
- Loser consolation: 20% of pool
- Platform fee: 10% of pool

**Tournament Belts:**
- Creation cost: 1,000-5,000 coins
- One-time fee, goes to platform

**System is ready for purchase integration!** ✅
