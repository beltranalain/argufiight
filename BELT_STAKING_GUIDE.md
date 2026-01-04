# Belt Staking Guide

## How to Stake Your Belt

### When Creating a Debate Challenge

1. **Open the Create Debate Modal** - Click the "+" button or "Create Debate" button
2. **Fill in your debate details** (topic, category, position, etc.)
3. **Scroll to "Stake a Belt" section** - If you own any active, unstaked belts, you'll see this option
4. **Check the "Stake a Belt" checkbox**
5. **Select which belt to stake** from the dropdown (only shows belts you own that can be staked)
6. **Create your challenge** - The belt will be automatically staked when the debate is created

**Important Notes:**
- Only ACTIVE or MANDATORY belts can be staked
- Belts that are already staked cannot be staked again
- If you lose the debate, the winner gets your belt
- If you win, you keep your belt

### When Joining/Creating a Tournament

**For Tournament Creation:**
- You cannot stake a belt when creating a tournament
- Tournaments must be IN_PROGRESS before belts can be staked

**For Tournament Participation:**
1. **Join a tournament** that is IN_PROGRESS
2. **Go to your Belt Room** (`/belts/room`)
3. **Click "View Details"** on any belt you own
4. **Scroll to "Stake Belt in Tournament"** section
5. **Select the tournament** from the list
6. **Click "Stake Belt"** - Your belt will be staked in that tournament

**Important Notes:**
- You must be a participant in the tournament
- Tournament must be IN_PROGRESS (not UPCOMING or COMPLETED)
- Only one belt can be staked per tournament per user
- If you win the tournament, you keep your belt
- If you lose, the tournament winner gets your belt

## Belt Challenge System (Separate from Regular Debates)

The belt challenge system is a special flow for challenging belt holders:

1. **Go to a Belt Details page** (`/belts/[id]`)
2. **Click "Challenge for this Belt"** button
3. **Pay the entry fee** (coins)
4. **Wait for the belt holder to accept**
5. **When accepted, a debate is automatically created** with the belt at stake

This is different from regular debate creation - it's specifically for challenging belt holders.

## Current Implementation Status

✅ **Debate Creation with Belt Staking** - COMPLETE
- Can select belt when creating any debate challenge
- Belt is automatically staked when debate is created
- Belt status updates to STAKED

✅ **Tournament Belt Staking** - COMPLETE  
- Available on belt details page when tournament is IN_PROGRESS
- Can stake belt after joining tournament

✅ **Belt Challenge System** - COMPLETE
- Special flow for challenging belt holders
- Entry fees and rewards calculated automatically
- ELO matching prevents abuse

## How It Works

### Belt Status Flow

1. **ACTIVE** - Belt is held and can be challenged/staked
2. **STAKED** - Belt is at risk in a debate or tournament
3. **MANDATORY** - Belt must be defended soon (can still be staked)
4. **INACTIVE** - Belt hasn't been defended recently
5. **VACANT** - No current holder

### What Happens When You Stake a Belt

**In a Debate:**
- Belt status changes to STAKED
- `isStaked` flag set to true
- Linked to the debate via `stakedInDebateId`
- When debate completes:
  - If you win: Belt returns to ACTIVE, you keep it
  - If you lose: Belt transfers to the winner

**In a Tournament:**
- Belt status changes to STAKED
- `isStaked` flag set to true
- Linked to tournament via `stakedInTournamentId`
- When tournament completes:
  - If you win: Belt returns to ACTIVE, you keep it
  - If you lose: Belt transfers to the tournament winner

## Troubleshooting

**Q: I don't see the "Stake a Belt" option when creating a debate**
- Make sure you own at least one belt
- Check that your belt status is ACTIVE or MANDATORY
- Verify the belt is not already staked

**Q: I can't stake my belt in a tournament**
- Tournament must be IN_PROGRESS (not UPCOMING)
- You must be a participant in the tournament
- Belt must be ACTIVE or MANDATORY and not already staked

**Q: How do I get a belt?**
- Win a belt challenge debate
- Win a tournament that has a belt
- Be assigned a belt by an admin
- Claim a vacant belt
