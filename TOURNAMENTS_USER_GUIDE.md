# Tournaments Feature - User Guide

## Current Status

**⚠️ IMPORTANT:** The Tournaments feature is currently **partially implemented**. The database schema exists and the admin panel can enable/disable it, but **there is no user-facing interface yet**.

## What's Working

✅ **Admin Panel:**
- Feature can be enabled/disabled in `/admin/tournaments`
- Admin can view all tournaments
- Setting is stored in database (`TOURNAMENTS_ENABLED`)

✅ **Database Schema:**
- Tournament models exist
- TournamentParticipant, TournamentMatch, TournamentRound models exist
- All necessary relationships are set up

## What's Missing

❌ **User-Facing Pages:**
- No `/tournaments` page for users to browse tournaments
- No `/tournaments/create` page for users to create tournaments
- No `/tournaments/[id]` page to view tournament details/brackets
- No navigation link to tournaments in the main menu

❌ **User APIs:**
- No `/api/tournaments` endpoint for users to fetch tournaments
- No `/api/tournaments/create` endpoint for users to create tournaments
- No `/api/tournaments/[id]/join` endpoint for users to register

## How It Should Work (When Fully Implemented)

### For Tournament Creators (Requires Subscription)

1. **Create Tournament:**
   - Navigate to `/tournaments`
   - Click "Create Tournament" button
   - Fill in tournament details:
     - Name
     - Description
     - Max participants (8, 16, 32, etc.)
     - Start date
     - Minimum ELO requirement (optional)
     - Judge selection (optional)
     - Round duration (hours per round)
   - Tournament created in `UPCOMING` status

2. **Manage Tournament:**
   - View registered participants
   - Start registration when ready
   - Monitor bracket progress
   - View tournament analytics

### For Participants (Free Users)

1. **Browse Tournaments:**
   - Navigate to `/tournaments`
   - See list of available tournaments
   - Filter by status (Upcoming, Registration Open, In Progress, Completed)

2. **Join Tournament:**
   - Click on a tournament
   - View tournament details
   - If requirements are met (ELO, etc.), click "Register"
   - Wait for tournament to start

3. **Participate:**
   - Receive notification when your match is scheduled
   - Debate your opponent
   - Advance if you win
   - Earn ELO from tournament debates

## Tournament Flow

1. **Creation** → Tournament created in `UPCOMING` status
2. **Registration** → Creator opens registration → Status changes to `REGISTRATION_OPEN`
3. **Seeding** → When max participants reached → Initial seeding by ELO
4. **Round 1** → Bracket generated → Status changes to `IN_PROGRESS`
5. **Matches** → Debates created for each match → Participants debate
6. **Reseeding** → After round completes → Reseed by ELO (if enabled)
7. **Next Round** → Generate new bracket → Repeat until winner
8. **Completion** → Final winner determined → Status changes to `COMPLETED`

## Next Steps to Complete Implementation

1. **Create User-Facing Pages:**
   - `app/(dashboard)/tournaments/page.tsx` - List all tournaments
   - `app/(dashboard)/tournaments/create/page.tsx` - Create tournament form
   - `app/(dashboard)/tournaments/[id]/page.tsx` - Tournament detail/bracket view

2. **Create User APIs:**
   - `app/api/tournaments/route.ts` - GET (list), POST (create)
   - `app/api/tournaments/[id]/route.ts` - GET (details), PUT (update)
   - `app/api/tournaments/[id]/join/route.ts` - POST (register)
   - `app/api/tournaments/[id]/bracket/route.ts` - GET (bracket visualization)

3. **Add Navigation:**
   - Add "Tournaments" link to main navigation
   - Add tournaments to dashboard sidebar (if feature enabled)

4. **Add Feature Gate:**
   - Check `TOURNAMENTS_ENABLED` setting before showing tournaments
   - Check subscription for tournament creation

5. **Add Notifications:**
   - Notify when tournament registration opens
   - Notify when match is scheduled
   - Notify when it's your turn to debate
   - Notify when round completes

## Testing the Feature Flag

To verify the feature flag is working:

1. **Check Admin Panel:**
   - Go to `/admin/tournaments`
   - Toggle should show current status
   - Status should persist after page refresh

2. **Check Database:**
   ```sql
   SELECT * FROM admin_settings WHERE key = 'TOURNAMENTS_ENABLED';
   ```
   Should return: `{ key: 'TOURNAMENTS_ENABLED', value: 'true' }`

3. **Check API:**
   ```bash
   curl https://your-domain.com/api/admin/settings
   ```
   Should include: `{ "TOURNAMENTS_ENABLED": "true" }`

## Current Limitations

- Users cannot see tournaments even when feature is enabled
- Users cannot create tournaments
- Users cannot join tournaments
- No bracket visualization exists
- No tournament notifications

The feature exists in the database but needs the user interface to be fully functional.

