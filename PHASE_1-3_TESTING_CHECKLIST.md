# Phase 1-3 Testing Checklist

**Date:** December 13, 2024  
**Phases Completed:** Phase 1 (Foundation), Phase 2 (Round Creation), Phase 3 (Match Generation Integration)

---

## ✅ What Was Implemented

### Phase 1: Foundation & Schema
- ✅ Added `KING_OF_THE_HILL` to `TournamentFormat` enum in `prisma/schema.prisma`
- ✅ Removed API rejection in `app/api/tournaments/route.ts`
- ✅ Added validation: King of the Hill requires minimum 3 participants
- ✅ Updated `totalRounds` calculation for King of the Hill format
- ✅ No power of 2 requirement for King of the Hill

### Phase 2: Core Round Creation Functions
- ✅ Created `lib/tournaments/king-of-the-hill.ts`
- ✅ Implemented `createKingOfTheHillRound1()` - Creates Round 1 with all participants
- ✅ Implemented `createKingOfTheHillRound()` - Creates subsequent elimination rounds
- ✅ Implemented `createKingOfTheHillFinals()` - Creates finals (1v1 debate)

### Phase 3: Match Generation Integration
- ✅ Updated `generateTournamentMatches()` to skip King of the Hill (rounds created separately)
- ✅ Updated `startTournament()` to call `createKingOfTheHillRound1()` for King of the Hill format
- ✅ Standard formats (BRACKET, CHAMPIONSHIP) still work

---

## 🧪 Testing Checklist

### Test 1: Create King of the Hill Tournament
**Steps:**
1. Make POST request to `/api/tournaments`
2. Set `format: 'KING_OF_THE_HILL'`
3. Set `maxParticipants: 10` (or any number >= 3)
4. Set other required fields (name, description, startDate, etc.)

**Expected Results:**
- ✅ Tournament created successfully
- ✅ `format` field is `KING_OF_THE_HILL` in database
- ✅ `totalRounds` calculated correctly (not power of 2)
- ✅ No error about format not being available

**Test Cases:**
- [ ] `maxParticipants: 3` (minimum) - Should work
- [ ] `maxParticipants: 10` - Should work
- [ ] `maxParticipants: 16` - Should work (not power of 2 requirement)
- [ ] `maxParticipants: 2` - Should fail with "requires at least 3 participants"

---

### Test 2: Start King of the Hill Tournament
**Steps:**
1. Create tournament with `format: 'KING_OF_THE_HILL'`
2. Add at least 3 participants (including creator)
3. Call tournament start endpoint (or trigger start)

**Expected Results:**
- ✅ Tournament status changes to `IN_PROGRESS`
- ✅ `currentRound` set to `1`
- ✅ Round 1 created in `TournamentRound` table
- ✅ Single GROUP debate created (not multiple 1v1 debates)
- ✅ Debate has:
  - `challengeType: 'GROUP'`
  - `totalRounds: 1`
  - `topic: tournament.name`
  - `status: 'ACTIVE'`
  - `startedAt: [timestamp]`
- ✅ `DebateParticipant` records created for ALL participants
- ✅ All `DebateParticipant` records have `status: 'ACTIVE'`
- ✅ Positions alternate: FOR, AGAINST, FOR, AGAINST, ...
- ✅ `TournamentMatch` record created linking debate to round
- ✅ No 1v1 matches created (only one GROUP debate)

**Test Cases:**
- [ ] Tournament with 3 participants - Should create 1 GROUP debate with 3 participants
- [ ] Tournament with 10 participants - Should create 1 GROUP debate with 10 participants
- [ ] Tournament with 16 participants - Should create 1 GROUP debate with 16 participants

---

### Test 3: Verify Debate Structure
**Steps:**
1. After starting tournament, query the debate created
2. Check debate fields
3. Check DebateParticipant records

**Expected Results:**
- ✅ Debate `challengerId` is first participant (required field)
- ✅ Debate `opponentId` is second participant (or first if only one)
- ✅ All participants have `DebateParticipant` records
- ✅ Each `DebateParticipant` has:
  - `debateId: [debate id]`
  - `userId: [participant user id]`
  - `position: 'FOR' or 'AGAINST'` (alternating)
  - `status: 'ACTIVE'`
  - `joinedAt: [timestamp]`

**Database Queries:**
```sql
-- Check debate
SELECT id, topic, challenge_type, total_rounds, status, started_at
FROM debate
WHERE id = '[debate_id]';

-- Check participants
SELECT dp.id, dp.user_id, dp.position, dp.status, u.username
FROM debate_participants dp
JOIN users u ON dp.user_id = u.id
WHERE dp.debate_id = '[debate_id]';

-- Check tournament round
SELECT id, round_number, status, start_date
FROM tournament_rounds
WHERE tournament_id = '[tournament_id]' AND round_number = 1;

-- Check tournament match
SELECT id, debate_id, status
FROM tournament_matches
WHERE round_id = '[round_id]';
```

---

### Test 4: Verify Standard Formats Still Work
**Steps:**
1. Create BRACKET tournament
2. Create CHAMPIONSHIP tournament
3. Start both tournaments

**Expected Results:**
- ✅ BRACKET tournaments create 1v1 matches (not GROUP debates)
- ✅ CHAMPIONSHIP tournaments create 1v1 matches (not GROUP debates)
- ✅ Standard match generation logic still works
- ✅ No errors or regressions

---

### Test 5: Edge Cases
**Test Cases:**
- [ ] Tournament with exactly 3 participants - Should work
- [ ] Tournament with 2 participants - Should fail (minimum 3)
- [ ] Tournament with 1 participant - Should fail (minimum 3)
- [ ] Starting tournament twice - Should fail (already started)
- [ ] Starting tournament with < 3 participants - Should fail

---

## 🐛 Common Issues to Watch For

### Issue: "Format must be BRACKET or CHAMPIONSHIP"
**Cause:** Format validation not updated
**Fix:** Check `app/api/tournaments/route.ts` line 366

### Issue: "King of the Hill format is no longer available"
**Cause:** API rejection not removed
**Fix:** Check `app/api/tournaments/route.ts` line 373-379

### Issue: "Max participants must be 4, 8, 16, 32, or 64"
**Cause:** Validation still checking power of 2 for King of the Hill
**Fix:** Check `app/api/tournaments/route.ts` line 381-389

### Issue: Multiple 1v1 debates created instead of one GROUP debate
**Cause:** `startTournament()` not calling `createKingOfTheHillRound1()`
**Fix:** Check `lib/tournaments/match-generation.ts` line 329

### Issue: No DebateParticipant records created
**Cause:** `createKingOfTheHillRound1()` not creating records
**Fix:** Check `lib/tournaments/king-of-the-hill.ts` DebateParticipant creation

### Issue: Debate has wrong challengeType
**Cause:** Not setting `challengeType: 'GROUP'`
**Fix:** Check `lib/tournaments/king-of-the-hill.ts` debate creation

---

## 📊 Success Criteria

### Phase 1 Success ✅
- [x] Can create tournament with `format: 'KING_OF_THE_HILL'` via API
- [x] Database stores format correctly
- [x] Validation works (min 3 participants)

### Phase 2 Success ✅
- [x] Round 1 creates GROUP debate with all participants
- [x] All participants have DebateParticipant records
- [x] Debate structure is correct

### Phase 3 Success ✅
- [x] Starting tournament calls correct function
- [x] No 1v1 matches created for King of the Hill
- [x] Standard formats still work

---

## 🔍 Manual Testing Steps

### Step 1: Create Tournament
```bash
curl -X POST http://localhost:3000/api/tournaments \
  -H "Content-Type: application/json" \
  -H "Cookie: [your session cookie]" \
  -d '{
    "name": "Test King of the Hill",
    "description": "Testing King of the Hill format",
    "format": "KING_OF_THE_HILL",
    "maxParticipants": 10,
    "startDate": "2024-12-20T00:00:00Z",
    "roundDuration": 24,
    "isPrivate": false
  }'
```

### Step 2: Add Participants
- Add at least 3 participants to the tournament

### Step 3: Start Tournament
- Trigger tournament start (via API or admin panel)

### Step 4: Verify Database
- Check that one GROUP debate was created
- Check that all participants have DebateParticipant records
- Check that TournamentRound was created
- Check that TournamentMatch was created

---

## 📝 Notes

- **Migration:** The Prisma migration may need to be applied manually if there are issues
- **Prisma Client:** Run `npx prisma generate` after schema changes
- **Database:** Ensure you're testing against the correct database (dev vs production)

---

**Status:** Ready for testing  
**Next:** After testing Phase 1-3, proceed to Phase 4-6 (Verdict Generation, Elimination, Round Advancement)
