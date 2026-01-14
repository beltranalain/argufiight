# Daily Login Coin Reward System - Implementation Plan

## Overview
Implement a daily login reward system that automatically grants coins to users when they log in. The reward amount increases based on consecutive login streaks, with multipliers that increase monthly. The streak resets if a user misses a day.

---

## 1. Database Schema Changes

### 1.1 Add Fields to User Model
Add the following fields to track login streaks and last login:

```prisma
model User {
  // ... existing fields ...
  coins                       Int                     @default(0)
  
  // Daily login reward fields
  lastLoginDate               DateTime?               @map("last_login_date")
  consecutiveLoginDays        Int                     @default(0) @map("consecutive_login_days")
  longestLoginStreak          Int                     @default(0) @map("longest_login_streak")
  totalLoginDays              Int                     @default(0) @map("total_login_days")
  lastDailyRewardDate        DateTime?               @map("last_daily_reward_date")
}
```

**Rationale:**
- `lastLoginDate`: Tracks the last time user logged in (for streak calculation)
- `consecutiveLoginDays`: Current streak count (resets on missed day)
- `longestLoginStreak`: All-time best streak (for achievements/display)
- `totalLoginDays`: Total days user has logged in (for analytics)
- `lastDailyRewardDate`: Prevents duplicate rewards on same day

### 1.2 Add New Coin Transaction Type
Add to `CoinTransactionType` enum:

```prisma
enum CoinTransactionType {
  // ... existing types ...
  DAILY_LOGIN_REWARD          // Daily login bonus
  STREAK_BONUS                // Bonus for maintaining streak milestones
}
```

### 1.3 Create Daily Login Reward Settings Table (Optional)
For admin-configurable reward amounts:

```prisma
model DailyLoginRewardSettings {
  id                    String   @id @default(uuid())
  baseReward            Int      @default(10) @map("base_reward")           // Base coins per day
  streakMultiplier      Float    @default(1.0) @map("streak_multiplier")   // Multiplier per month
  monthlyMultiplierCap  Float    @default(3.0) @map("monthly_multiplier_cap") // Max multiplier
  milestoneRewards      Json?    @map("milestone_rewards")                  // Special rewards at 7, 30, 100 days, etc.
  isActive              Boolean  @default(true) @map("is_active")
  updatedAt             DateTime @updatedAt @map("updated_at")
  updatedBy             String?  @map("updated_by")
  
  @@map("daily_login_reward_settings")
}
```

**Alternative:** Store settings in `AdminSetting` table with keys:
- `DAILY_LOGIN_BASE_REWARD`: "10"
- `DAILY_LOGIN_STREAK_MULTIPLIER`: "0.1" (10% increase per month)
- `DAILY_LOGIN_MONTHLY_CAP`: "3.0"

---

## 2. Reward Calculation Logic

### 2.1 Base Reward Formula

```
Base Reward = 10 coins (configurable)

Monthly Multiplier = 1 + (consecutiveLoginDays / 30) * streakMultiplier
Capped Multiplier = min(Monthly Multiplier, monthlyMultiplierCap)

Daily Reward = Base Reward * Capped Multiplier (rounded down)
```

**Example Calculations:**
- Day 1: 10 coins (1.0x multiplier)
- Day 7: 10 coins (1.0x multiplier) - no monthly bonus yet
- Day 30: 11 coins (1.1x multiplier) - 1 month streak
- Day 60: 12 coins (1.2x multiplier) - 2 month streak
- Day 90: 13 coins (1.3x multiplier) - 3 month streak
- Day 120: 13 coins (1.3x multiplier) - capped at 3.0x

### 2.2 Streak Milestone Bonuses (Optional)
Additional one-time bonuses at milestones:
- 7 days: +50 coins
- 30 days: +200 coins
- 60 days: +500 coins
- 100 days: +1000 coins
- 365 days: +5000 coins

---

## 3. Implementation Components

### 3.1 Login Detection Hook
**Location:** `lib/auth.ts` or `app/api/auth/login/route.ts`

**Function:** `checkAndRewardDailyLogin(userId: string)`

**Logic:**
1. Fetch user from database
2. Get current date (UTC, normalized to start of day)
3. Check if `lastDailyRewardDate` is today
   - If yes: Skip (already rewarded today)
   - If no: Continue
4. Check if `lastLoginDate` exists
   - If no: First login - set streak to 1
   - If yes: Calculate days since last login
     - If 0 days: Same day multiple logins - skip reward
     - If 1 day: Consecutive - increment streak
     - If >1 day: Streak broken - reset to 1
5. Calculate reward amount based on streak
6. Update user:
   - Increment `coins`
   - Update `consecutiveLoginDays`
   - Update `lastLoginDate` = now
   - Update `lastDailyRewardDate` = today
   - Update `totalLoginDays` += 1
   - Update `longestLoginStreak` if current > longest
7. Create `CoinTransaction` record
8. (Optional) Check for milestone bonuses and award them

**Pseudocode:**
```typescript
async function checkAndRewardDailyLogin(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  const lastRewardDate = user.lastDailyRewardDate 
    ? new Date(user.lastDailyRewardDate).setUTCHours(0, 0, 0, 0)
    : null;

  // Already rewarded today
  if (lastRewardDate && lastRewardDate.getTime() === today.getTime()) {
    return;
  }

  let streak = user.consecutiveLoginDays || 0;
  const lastLogin = user.lastLoginDate;

  if (!lastLogin) {
    // First login
    streak = 1;
  } else {
    const daysSinceLastLogin = Math.floor(
      (today.getTime() - new Date(lastLogin).setUTCHours(0, 0, 0, 0).getTime()) 
      / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastLogin === 0) {
      // Same day, already processed
      return;
    } else if (daysSinceLastLogin === 1) {
      // Consecutive day
      streak += 1;
    } else {
      // Streak broken
      streak = 1;
    }
  }

  // Calculate reward
  const baseReward = 10; // From settings
  const monthlyMultiplier = Math.min(
    1 + (streak / 30) * 0.1, // 10% per month
    3.0 // Cap at 3x
  );
  const dailyReward = Math.floor(baseReward * monthlyMultiplier);

  // Update user
  await prisma.user.update({
    where: { id: userId },
    data: {
      coins: { increment: dailyReward },
      consecutiveLoginDays: streak,
      longestLoginStreak: Math.max(user.longestLoginStreak || 0, streak),
      totalLoginDays: { increment: 1 },
      lastLoginDate: new Date(),
      lastDailyRewardDate: today,
    },
  });

  // Create transaction record
  await prisma.coinTransaction.create({
    data: {
      userId,
      type: 'DAILY_LOGIN_REWARD',
      amount: dailyReward,
      balanceAfter: user.coins + dailyReward,
      description: `Daily login reward (${streak} day streak)`,
      metadata: {
        streak,
        multiplier: monthlyMultiplier,
        baseReward,
      },
    },
  });

  // Check milestones (optional)
  if ([7, 30, 60, 100, 365].includes(streak)) {
    await awardMilestoneBonus(userId, streak);
  }
}
```

### 3.2 Integration Points

**A. Authentication Flow**
- Call `checkAndRewardDailyLogin()` after successful login
- Locations:
  - `app/api/auth/login/route.ts` (email/password login)
  - `app/api/auth/google/route.ts` (Google OAuth)
  - `app/api/auth/callback/route.ts` (OAuth callback)
  - Any middleware that validates sessions on page load

**B. Session Validation**
- Call on authenticated page loads (if not already called today)
- Middleware: `middleware.ts` or session validation utilities
- Only call once per day per user (check `lastDailyRewardDate`)

**C. API Endpoint (Optional)**
Create dedicated endpoint for manual claim:
- `app/api/rewards/daily-login/route.ts`
- POST endpoint that checks and rewards
- Useful for mobile apps or manual triggers

---

## 4. Admin Dashboard Updates

### 4.1 Admin Users Page (`/admin/users`)

**Add Coin Display:**
- Show `coins` balance in user card/list
- Display format: "Coins: 1,234" or badge
- Add filter/sort by coin balance

**Add Login Streak Info:**
- Display `consecutiveLoginDays` in user details
- Display `longestLoginStreak` (all-time best)
- Display `totalLoginDays` (total logins)
- Display `lastLoginDate` (last login timestamp)

**UI Location:**
- In user card: Add coin badge next to ELO rating
- In user detail modal/page: Add "Login Stats" section

**Example Display:**
```
User: username
Email: user@example.com
ELO: 1200 | Coins: 1,234
Current Streak: 15 days | Best Streak: 30 days | Total Logins: 45
Last Login: 1/10/2026
```

### 4.2 Admin Coins Page (`/admin/coins`)

**Add Daily Login Reward Section:**
- New tab: "Daily Rewards" or subsection
- Display statistics:
  - Total daily rewards given today
  - Average streak length
  - Users with active streaks
  - Top streaks
- Settings panel to configure:
  - Base reward amount
  - Streak multiplier
  - Monthly cap
  - Milestone rewards

**Add Transaction Filter:**
- Filter `CoinTransaction` by type `DAILY_LOGIN_REWARD`
- Show daily login reward history
- Aggregate by date/user

---

## 5. User-Facing Features (Optional)

### 5.1 Login Reward Notification
- Show notification/toast when user logs in and receives reward
- Display: "You earned 12 coins! (15 day streak)"
- Link to coin balance or reward history

### 5.2 Streak Display
- Show current streak on user profile
- Show "Next milestone in X days"
- Visual progress bar for monthly multiplier

### 5.3 Reward History Page
- User can view their daily login reward history
- Show streak progression over time
- Display milestone achievements

---

## 6. Implementation Steps

### Phase 1: Database & Core Logic
1. ✅ Create Prisma migration for new User fields
2. ✅ Add `DAILY_LOGIN_REWARD` to `CoinTransactionType` enum
3. ✅ Implement `checkAndRewardDailyLogin()` function
4. ✅ Add unit tests for reward calculation logic
5. ✅ Test streak reset logic (missed day scenario)

### Phase 2: Integration
6. ✅ Integrate into login flow (email/password)
7. ✅ Integrate into OAuth flow (Google)
8. ✅ Add to session validation middleware
9. ✅ Create API endpoint for manual claim (optional)
10. ✅ Test edge cases (timezone, midnight rollover)

### Phase 3: Admin Dashboard
11. ✅ Update `/admin/users` page to display coins
12. ✅ Add login streak info to user cards/details
13. ✅ Update `/admin/coins` page with daily reward section
14. ✅ Add settings panel for reward configuration
15. ✅ Add transaction filtering for daily rewards

### Phase 4: User Experience (Optional)
16. ✅ Add login reward notification
17. ✅ Add streak display to user profile
18. ✅ Create reward history page
19. ✅ Add milestone celebration UI

### Phase 5: Testing & Optimization
20. ✅ Test with multiple users and timezones
21. ✅ Verify no duplicate rewards on same day
22. ✅ Test streak reset scenarios
23. ✅ Performance testing (database queries)
24. ✅ Monitor coin distribution analytics

---

## 7. Edge Cases & Considerations

### 7.1 Timezone Handling
- **Issue:** User logs in at 11 PM local time, then 1 AM next day
- **Solution:** Use UTC dates normalized to start of day for consistency
- Store all dates in UTC, compare by date only (ignore time)

### 7.2 Multiple Logins Same Day
- **Issue:** User logs in multiple times in one day
- **Solution:** Check `lastDailyRewardDate` - if today, skip reward
- Only reward once per calendar day

### 7.3 Session Refresh vs New Login
- **Issue:** User has active session, page refreshes
- **Solution:** Only check on actual login, not session validation
- Or: Check `lastDailyRewardDate` on session validation, but only reward if not today

### 7.4 Database Performance
- **Issue:** Checking/updating on every login
- **Solution:** 
  - Index `lastDailyRewardDate` field
  - Use transaction to ensure atomicity
  - Consider caching user's reward status in session

### 7.5 Streak Calculation Edge Cases
- **Issue:** User logs in at 11:59 PM, then 12:01 AM
- **Solution:** Use date-only comparison (ignore time)
- If last login was yesterday (any time) and today is today (any time), it's consecutive

### 7.6 Migration for Existing Users
- **Issue:** Existing users don't have `lastLoginDate`
- **Solution:** 
  - Set `consecutiveLoginDays` = 0 for all existing users
  - First login after migration starts streak at 1
  - Or: Use `createdAt` as initial `lastLoginDate` (but streak = 0)

---

## 8. Configuration & Settings

### 8.1 Default Values
```typescript
const DEFAULT_SETTINGS = {
  baseReward: 10,              // Base coins per day
  streakMultiplier: 0.1,      // 10% increase per month
  monthlyMultiplierCap: 3.0,  // Max 3x multiplier
  milestones: {
    7: 50,      // 7 days: +50 coins
    30: 200,    // 30 days: +200 coins
    60: 500,    // 60 days: +500 coins
    100: 1000,  // 100 days: +1000 coins
    365: 5000,  // 365 days: +5000 coins
  },
};
```

### 8.2 Admin Configuration
Store in `AdminSetting` table:
- `DAILY_LOGIN_BASE_REWARD`: "10"
- `DAILY_LOGIN_STREAK_MULTIPLIER`: "0.1"
- `DAILY_LOGIN_MONTHLY_CAP`: "3.0"
- `DAILY_LOGIN_MILESTONE_7`: "50"
- `DAILY_LOGIN_MILESTONE_30`: "200"
- etc.

---

## 9. Testing Checklist

### 9.1 Unit Tests
- [ ] Reward calculation with various streak lengths
- [ ] Multiplier capping at maximum
- [ ] Streak reset on missed day
- [ ] Consecutive day detection
- [ ] Same-day duplicate prevention

### 9.2 Integration Tests
- [ ] Login flow awards coins
- [ ] Multiple logins same day = one reward
- [ ] Streak increments correctly
- [ ] Streak resets after missed day
- [ ] CoinTransaction created correctly
- [ ] User balance updates correctly

### 9.3 Edge Case Tests
- [ ] Timezone boundaries (11 PM → 1 AM)
- [ ] First-time user login
- [ ] User with no previous login
- [ ] Very long streaks (100+ days)
- [ ] Concurrent login attempts

### 9.4 Admin Dashboard Tests
- [ ] Coin balance displays correctly
- [ ] Streak info shows in user cards
- [ ] Transaction history filters work
- [ ] Settings can be updated

---

## 10. Rollout Strategy

### 10.1 Soft Launch
1. Deploy to staging environment
2. Test with test accounts
3. Monitor database queries and performance
4. Verify coin balances and transactions

### 10.2 Gradual Rollout
1. Enable for new users only (first)
2. Enable for existing users (after validation)
3. Monitor for issues or abuse
4. Adjust reward amounts if needed

### 10.3 Monitoring
- Track daily reward distribution
- Monitor average streak lengths
- Watch for unusual patterns (potential abuse)
- Track coin economy balance

---

## 11. Future Enhancements

### 11.1 Weekly/Monthly Bonuses
- Bonus rewards for logging in every day of the week
- Monthly completion bonus

### 11.2 Streak Protection
- Allow users to "freeze" streak once per month (prevent reset)
- Purchase streak protection with coins

### 11.3 Social Features
- Leaderboard for longest streaks
- Share streak achievements
- Streak challenges between users

### 11.4 Advanced Multipliers
- Activity-based multipliers (debates, comments, etc.)
- Seasonal multipliers (holidays, events)
- Referral bonuses

---

## 12. Files to Create/Modify

### New Files:
- `lib/rewards/daily-login.ts` - Core reward logic
- `app/api/rewards/daily-login/route.ts` - API endpoint (optional)
- `components/admin/UserCoinDisplay.tsx` - Coin display component
- `components/admin/LoginStreakDisplay.tsx` - Streak display component

### Modified Files:
- `prisma/schema.prisma` - Add User fields, enum values
- `app/api/auth/login/route.ts` - Add reward check
- `app/api/auth/google/route.ts` - Add reward check
- `app/admin/users/page.tsx` - Add coin/streak display
- `app/admin/coins/page.tsx` - Add daily reward section
- `lib/prisma.ts` - (if needed for reward queries)

---

## Summary

This plan implements a daily login coin reward system with:
- ✅ Automatic coin rewards on login
- ✅ Streak-based multipliers (increases monthly)
- ✅ Streak reset on missed day
- ✅ Coin balance display in admin users page
- ✅ Transaction tracking and history
- ✅ Admin-configurable settings
- ✅ Robust edge case handling

The system is designed to be:
- **Fair:** Prevents duplicate rewards, handles timezones correctly
- **Scalable:** Efficient database queries, indexed fields
- **Maintainable:** Clear separation of concerns, well-documented
- **Flexible:** Admin-configurable reward amounts and multipliers
