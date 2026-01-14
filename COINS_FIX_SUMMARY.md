# Coins Not Showing - Fix Applied

## Problem
User logged out and logged back in but coins were still showing as 0.

## Root Cause
The `/api/auth/me` endpoint was **not returning the `coins` field**, so even though coins were being added to the database, the frontend couldn't see them.

## Fixes Applied

### 1. Added `coins` to `/api/auth/me` endpoint
- Added `coins: true` to the Prisma select statement
- Added `coins: user.coins` to the response object
- This ensures user data includes coin balance

### 2. Updated `useAuth` hook
- Added `coins` to the User interface
- Added `coins` normalization in fetchUser function
- This ensures coins are available in the auth context

### 3. Added debugging logs
- Added console logs to `useDailyLoginReward` hook
- This will help troubleshoot if issues persist

## Testing Steps

1. **Clear browser cache** or do a hard refresh (Ctrl+Shift+R)
2. **Log out and log back in**
3. **Check browser console** - you should see:
   - `[useDailyLoginReward] Claiming daily reward...`
   - `[useDailyLoginReward] Reward data: { rewarded: true, rewardAmount: 10, ... }`
4. **Check Network tab** - `/api/auth/me` should return `coins` field
5. **Check coins page** - should show updated balance

## If Still Not Working

### Check Database
```sql
SELECT coins, consecutive_login_days, last_daily_reward_date 
FROM users 
WHERE email = 'beltranalain@yahoo.com';
```

### Manual API Test
Open browser console and run:
```javascript
// Check if coins are in user data
fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log('Coins:', d.user?.coins))

// Manually claim reward
fetch('/api/rewards/daily-login', { 
  method: 'POST', 
  credentials: 'include' 
})
  .then(r => r.json())
  .then(console.log)
```

### Reset Reward Date (for testing)
```sql
-- Allow claiming again today (for testing only)
UPDATE users 
SET last_daily_reward_date = NULL 
WHERE email = 'beltranalain@yahoo.com';
```

## Expected Behavior

After logging in:
1. ✅ Daily reward is automatically claimed
2. ✅ Notification shows: "You earned 10 coins!"
3. ✅ Coins appear in "My Coins" page
4. ✅ Coins appear in admin users page
5. ✅ User data includes coins field

The fix is complete - coins should now appear after you log in!
