# Troubleshooting: Coins Not Showing After Login

## Issue
User logged out and logged back in but coins are still showing as 0.

## Debugging Steps

### 1. Check Browser Console
Open your browser's developer console (F12) and look for:
- `[useDailyLoginReward]` logs - Should show reward claiming process
- `[useAuth]` logs - Should show user data being fetched
- Any error messages

### 2. Check Network Tab
In browser DevTools → Network tab:
- Look for `/api/rewards/daily-login` request
- Check if it returns 200 OK
- Check the response - should show `rewarded: true` and `rewardAmount: X`

### 3. Manual Test
Try calling the API directly:
```javascript
// In browser console:
fetch('/api/rewards/daily-login', { method: 'POST', credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

### 4. Check Database
Verify coins were actually added:
```sql
SELECT id, username, email, coins, consecutive_login_days, last_daily_reward_date 
FROM users 
WHERE email = 'beltranalain@yahoo.com';
```

## Common Issues

### Issue 1: Prisma Client Not Regenerated
**Symptom**: API errors about missing fields
**Fix**: Run `npx prisma generate` (close IDE first)

### Issue 2: Hook Not Triggering
**Symptom**: No console logs from `[useDailyLoginReward]`
**Fix**: Check if `DailyLoginReward` component is in layout.tsx

### Issue 3: Already Rewarded Today
**Symptom**: API returns `rewarded: false, rewardAmount: 0`
**Fix**: Wait until tomorrow or manually reset `last_daily_reward_date` in database

### Issue 4: User Data Not Refreshing
**Symptom**: Coins in database but not in UI
**Fix**: Check if `/api/auth/me` returns `coins` field

## Quick Fix: Manual Reward
If you need to test immediately, you can manually add coins:

```sql
-- Add 10 coins manually
UPDATE users 
SET coins = coins + 10 
WHERE email = 'beltranalain@yahoo.com';

-- Reset reward date to allow claiming again
UPDATE users 
SET last_daily_reward_date = NULL 
WHERE email = 'beltranalain@yahoo.com';
```

## Next Steps
1. Check browser console for errors
2. Check Network tab for API calls
3. Verify database has coins
4. Try manual API call in console
5. Report findings
