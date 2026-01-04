# Belt System Test Data Guide

This guide explains how to create comprehensive test data for the belt system.

## Quick Start

```powershell
# Make sure belt system is enabled
Get-Content .env | Select-String "ENABLE_BELT_SYSTEM"

# If not enabled, add it:
Add-Content .env "`nENABLE_BELT_SYSTEM=true"

# Run the test data script
npx tsx scripts/create-belt-test-data.ts
```

## What the Script Creates

### 1. Test Users (5 users with different ELO ratings)
- `belt_champion` - ELO 1800 (Champion)
- `belt_contender` - ELO 1600 (Contender)
- `belt_challenger` - ELO 1400 (Challenger)
- `belt_rookie` - ELO 1200 (Rookie)
- `belt_veteran` - ELO 1500 (Veteran)

### 2. Test Belts

#### Category Belts
- **SPORTS Championship Belt** - Held by `belt_champion`
- **POLITICS Championship Belt** - Held by `belt_contender`
- **TECH Championship Belt** - VACANT (no holder)

#### Special Belts
- **Rookie Champion Belt** - Held by `belt_rookie` (in GRACE_PERIOD)
- **Inactive Championship Belt** - Held by `belt_contender` (INACTIVE status, not defended for 35 days)

### 3. Test Challenges

The script creates challenges with different statuses:
- **PENDING** - Challenge awaiting response
- **ACCEPTED** - Challenge accepted, belt is STAKED
- **DECLINED** - Challenge declined by holder
- **EXPIRED** - Challenge expired (past expiration date)

## Testing Scenarios

### Scenario 1: View Belt Room
1. Visit `http://localhost:3002/belts/room`
2. Login as one of the test users
3. See their current belts and belt history

### Scenario 2: View Belt Details
1. Visit `http://localhost:3002/belts/[belt-id]`
2. See belt information, holder, stats, and pending challenges
3. Create a challenge (if eligible)

### Scenario 3: Admin Belt Management
1. Visit `http://localhost:3002/admin/belts`
2. View all belts, filter by type/status
3. Click on a belt to see details
4. Manually transfer a belt (admin only)

### Scenario 4: Create Challenge
1. Login as a user with ELO within range
2. Navigate to a belt page
3. Click "Challenge" button
4. Pay entry fee (placeholder for now)
5. Challenge is created with PENDING status

### Scenario 5: Accept/Decline Challenge
1. Login as belt holder
2. View pending challenges
3. Accept or decline challenge
4. If accepted, belt becomes STAKED

### Scenario 6: Inactive Belt Competition
1. Find an INACTIVE belt
2. Top 2 eligible competitors can challenge
3. Challenge the inactive belt

## Belt Statuses Explained

- **ACTIVE** - Currently held, can be challenged
- **INACTIVE** - Not defended for 30+ days, top competitors can compete
- **VACANT** - No holder, anyone can claim
- **STAKED** - Currently at risk in a debate/tournament
- **GRACE_PERIOD** - First 30 days, protected from loss
- **MANDATORY** - Mandatory defense required

## Challenge Statuses Explained

- **PENDING** - Challenge sent, awaiting response
- **ACCEPTED** - Challenge accepted, debate created
- **DECLINED** - Challenge declined
- **EXPIRED** - Challenge expired (time limit)
- **CANCELLED** - Challenge cancelled by challenger
- **COMPLETED** - Challenge completed, belt transferred

## ELO Matching Rules

- Users can only challenge belts held by users within ±200 ELO points (default)
- Win streaks can increase the allowed range (multiplier: 1.2x)
- This prevents ELO abuse (high ELO users challenging low ELO users)

## Coin System (Placeholder)

Currently, the coin system is a placeholder:
- Entry fees are calculated but not deducted
- Rewards are calculated but not distributed
- When the coin system is implemented, these will be connected

## Troubleshooting

### "Belt system is not enabled"
- Check `.env` file has `ENABLE_BELT_SYSTEM=true`
- Restart dev server after changing `.env`

### "No active belt found"
- Run the test data script first
- Check database has belts with holders

### "ELO difference too large"
- The challenger's ELO must be within ±200 points of the holder
- Use users with closer ELO ratings

### "Belt is currently staked"
- The belt is already in a debate/tournament
- Wait for the debate to complete or use a different belt

## Next Steps

1. **Test the UI** - Visit belt pages and interact with the system
2. **Create real debates** - Accept challenges and create debates
3. **Test belt transfers** - Complete debates and see belts transfer
4. **Test inactive belts** - Wait for belts to become inactive
5. **Test admin features** - Use admin panel to manage belts

## Clean Up Test Data

To remove test data:

```sql
-- Delete test challenges
DELETE FROM belt_challenges WHERE challenger_id IN (
  SELECT id FROM users WHERE email LIKE '%@test.com'
);

-- Delete belt history
DELETE FROM belt_history WHERE from_user_id IN (
  SELECT id FROM users WHERE email LIKE '%@test.com'
) OR to_user_id IN (
  SELECT id FROM users WHERE email LIKE '%@test.com'
);

-- Delete belts
DELETE FROM belts WHERE id IN (
  SELECT id FROM belts WHERE name LIKE '%Test%' OR name LIKE '%Championship%'
);

-- Delete test users (optional)
DELETE FROM users WHERE email LIKE '%@test.com';
```

**Note:** Be careful when deleting data. Consider backing up first.
