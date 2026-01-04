# Belt Champion Testing Guide

## User Account
- **Username:** `belt_champion`
- **Email:** `champion@test.com`
- **Coins:** 1,000,000 coins (granted for testing)
- **Balance Value:** $10,000 USD

---

## Quick Start Testing

### 1. Log In
- Go to `/login`
- Email: `champion@test.com`
- Password: (check with admin or use password reset)

### 2. Verify Coins
- Click your profile dropdown (top right)
- You should see "1,000,000" coins displayed at the top
- Click "My Coins" to see full transaction history
- You should see an "ADMIN_GRANT" transaction for 1,000,000 coins

### 3. Test Coin Features

#### Purchase Flow (Optional - for testing)
1. Go to `/coins/purchase`
2. View available packages
3. Test the purchase flow (use Stripe test mode)

#### View Transaction History
1. Go to `/coins` (or click "My Coins" from dropdown)
2. Verify you can see:
   - Current balance: 1,000,000 coins
   - Transaction history showing the grant

---

## Testing Belt System

### 1. View Belt Room
- Go to `/belts/room`
- You should see:
  - Any belts you currently hold
  - Belt history
  - "How Belts Work" guide (new instructions)

### 2. Challenge for a Belt
1. Go to `/belts` or browse available belts
2. Click on any active belt
3. Click "Challenge for Belt"
4. Pay entry fee (coins will be deducted)
5. Wait for acceptance
6. Debate for the belt

### 3. Create Tournament Belt (If Admin)
1. Go to `/admin/tournaments`
2. Create or edit a tournament
3. Add a belt prize (costs 1,000-5,000 coins)
4. Belt will be awarded to winner

---

## Testing Scenarios

### Scenario 1: Challenge a Belt
1. Find an active belt (check `/admin/belts` if needed)
2. Challenge for it (pay entry fee)
3. Verify coins are deducted
4. Check transaction history shows "BELT_CHALLENGE_ENTRY"

### Scenario 2: Win a Belt Challenge
1. Challenge a belt
2. Win the debate
3. Verify:
   - Belt is transferred to you
   - Coins are rewarded (check transaction history)
   - Belt appears in your Belt Room

### Scenario 3: Lose a Belt Challenge
1. Challenge a belt
2. Lose the debate
3. Verify:
   - Entry fee was deducted
   - No belt transfer
   - Consolation coins may be granted (if applicable)

### Scenario 4: Defend Your Belt
1. If you hold a belt, wait for a challenge
2. Accept the challenge
3. Win or lose the debate
4. Verify belt transfer logic works correctly

---

## Admin Testing

If you have admin access:

### Grant/Deduct Coins
1. Go to `/admin/coins`
2. Click "Users" tab
3. Find `belt_champion`
4. Click "View Details"
5. Test:
   - Grant coins (add more)
   - Deduct coins (remove some)
   - View transaction history

### View Coin Statistics
1. Go to `/admin/coins`
2. Click "Stats" tab
3. View:
   - Total revenue
   - Coins sold
   - Average purchase
   - Most popular package

### Manage Coin Packages
1. Go to `/admin/coins`
2. Click "Packages" tab
3. Edit package prices and bonuses
4. Verify changes reflect on purchase page

---

## Expected Coin Balance

After initial grant:
- **Starting Balance:** 1,000,000 coins
- **After Belt Challenge (100 coins):** 999,900 coins
- **After Winning (75 coins reward):** 999,975 coins
- **Net Cost:** 25 coins per challenge (if you win)

---

## Troubleshooting

### Coins Not Showing
1. Hard refresh browser (Ctrl+Shift+R)
2. Check transaction history
3. Verify you're logged in as `belt_champion`
4. Check browser console for errors

### Can't Challenge Belt
1. Verify you have enough coins
2. Check belt status (must be ACTIVE or MANDATORY)
3. Verify ELO matching (you must be within allowed range)
4. Check if belt is already staked

### Transaction Not Appearing
1. Wait a few seconds (transactions are real-time)
2. Refresh the page
3. Check transaction history
4. Verify API endpoint is working

---

## Test Checklist

- [ ] Can see 1,000,000 coins in dropdown
- [ ] Can view coin balance page
- [ ] Can view transaction history
- [ ] Can challenge a belt (coins deducted)
- [ ] Can see belt challenge entry in history
- [ ] Can win/lose belt challenge
- [ ] Coins are rewarded/consolation given
- [ ] Belt transfers correctly
- [ ] All transactions appear in history
- [ ] Can purchase more coins (if testing purchase flow)
- [ ] Admin can grant/deduct coins
- [ ] Admin can view statistics

---

## Notes

- **Coins never expire** - Your balance persists indefinitely
- **Entry fees are non-refundable** - Once you challenge, coins are deducted
- **Rewards vary** - Based on belt value and number of participants
- **Transaction history** - All coin activities are logged permanently

---

**Last Updated:** January 3, 2025
