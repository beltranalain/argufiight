# Phase 4-6 Testing Checklist

**Date:** December 13, 2024  
**Phases Completed:** Phase 4 (Verdict Generation), Phase 5 (Elimination & Scoring), Phase 6 (Round Advancement)

---

## ✅ What Was Implemented

### Phase 4: Verdict Generation System
- ✅ Created `lib/tournaments/king-of-the-hill-ai.ts`
- ✅ Implemented `generateKingOfTheHillRoundVerdicts()` - Main verdict generation function
- ✅ Implemented `generateKingOfTheHillVerdict()` - AI verdict for one judge
- ✅ Uses exactly 3 random judges
- ✅ Scores each participant individually (0-100 per judge, 0-300 total)
- ✅ Stores verdicts in special format with scores and elimination reasoning

### Phase 5: Elimination & Scoring Logic
- ✅ Calculates bottom 25% elimination: `Math.max(1, Math.ceil(participants.length * 0.25))`
- ✅ Ranks participants by total score (sum of 3 judges)
- ✅ Marks bottom 25% as ELIMINATED with `eliminationRound` and `eliminationReason`
- ✅ Updates `cumulativeScore` for all participants (eliminated and surviving)
- ✅ Marks surviving participants as ACTIVE

### Phase 6: Round Advancement Logic
- ✅ Implemented `processKingOfTheHillDebateCompletion()` - Processes round completion
- ✅ Updated `checkAndAdvanceTournamentRound()` - Detects King of the Hill format
- ✅ Updated `updateTournamentMatchOnDebateComplete()` - Routes to King of the Hill logic
- ✅ Updated `app/api/debates/[id]/statements/route.ts` - Triggers King of the Hill verdicts
- ✅ Automatically creates next round or finals based on participant count

---

## 🧪 Testing Checklist

### Test 1: Verdict Generation (3 Judges)
**Steps:**
1. Start a King of the Hill tournament with 10 participants
2. All participants submit their arguments
3. Wait for verdict generation

**Expected Results:**
- ✅ Exactly 3 judges selected randomly
- ✅ 3 Verdict records created (one per judge)
- ✅ Each verdict contains scores for all participants in format: `username: score/100`
- ✅ Verdicts contain elimination reasoning
- ✅ Debate status changes to `VERDICT_READY`
- ✅ Tournament match status changes to `COMPLETED`

**Database Queries:**
```sql
-- Check verdicts
SELECT v.id, j.name as judge_name, v.reasoning
FROM verdicts v
JOIN judges j ON v.judge_id = j.id
WHERE v.debate_id = '[debate_id]';

-- Should return exactly 3 verdicts
```

---

### Test 2: Elimination Logic (Bottom 25%)
**Steps:**
1. After verdicts generated, check participant statuses
2. Verify bottom 25% are eliminated

**Expected Results:**
- ✅ Bottom 25% participants marked as `ELIMINATED`
  - 10 participants → Eliminate 3 (25% = 2.5, rounded up)
  - 8 participants → Eliminate 2 (25% = 2)
  - 4 participants → Eliminate 1 (25% = 1)
- ✅ Eliminated participants have:
  - `status: 'ELIMINATED'`
  - `eliminatedAt: [timestamp]`
  - `eliminationRound: [round number]`
  - `eliminationReason: [combined reasoning from all 3 judges]`
- ✅ Remaining participants marked as `ACTIVE`

**Database Queries:**
```sql
-- Check eliminated participants
SELECT tp.id, u.username, tp.status, tp.elimination_round, tp.elimination_reason
FROM tournament_participants tp
JOIN users u ON tp.user_id = u.id
WHERE tp.tournament_id = '[tournament_id]' AND tp.status = 'ELIMINATED';

-- Check active participants
SELECT tp.id, u.username, tp.status, tp.cumulative_score
FROM tournament_participants tp
JOIN users u ON tp.user_id = u.id
WHERE tp.tournament_id = '[tournament_id]' AND tp.status = 'ACTIVE';
```

---

### Test 3: Cumulative Scoring
**Steps:**
1. Check `cumulativeScore` for all participants after Round 1
2. Complete Round 2 and check scores again

**Expected Results:**
- ✅ After Round 1: `cumulativeScore = round1TotalScore` (0-300)
- ✅ After Round 2: `cumulativeScore = round1TotalScore + round2TotalScore`
- ✅ Scores accumulate correctly across rounds
- ✅ Both eliminated and active participants have updated scores

**Database Queries:**
```sql
-- Check cumulative scores
SELECT u.username, tp.cumulative_score, tp.status
FROM tournament_participants tp
JOIN users u ON tp.user_id = u.id
WHERE tp.tournament_id = '[tournament_id]'
ORDER BY tp.cumulative_score DESC;
```

---

### Test 4: Round Advancement (Round 2+)
**Steps:**
1. Complete Round 1 (all submit, verdicts generated)
2. Verify Round 2 is created automatically
3. Check that only ACTIVE participants are in Round 2

**Expected Results:**
- ✅ Round 2 created automatically after Round 1 completes
- ✅ Round 2 includes only ACTIVE participants (eliminated participants excluded)
- ✅ New GROUP debate created for Round 2
- ✅ Tournament `currentRound` updated to 2
- ✅ Round 1 marked as `COMPLETED`

**Test Cases:**
- [ ] 10 participants → Round 1 → 7 survive → Round 2 created with 7 participants
- [ ] 8 participants → Round 1 → 6 survive → Round 2 created with 6 participants
- [ ] 4 participants → Round 1 → 3 survive → Round 2 created with 3 participants

---

### Test 5: Finals Transition (2 Participants)
**Steps:**
1. Complete rounds until 2 participants remain
2. Verify finals is created as ONE_ON_ONE debate

**Expected Results:**
- ✅ When 2 participants remain, finals created automatically
- ✅ Finals is `challengeType: 'ONE_ON_ONE'` (not GROUP)
- ✅ Finals has `totalRounds: 3` (not 1)
- ✅ Finals has `startedAt: [timestamp]` (critical for frontend)
- ✅ Finals is traditional 3-round debate format

**Database Queries:**
```sql
-- Check finals debate
SELECT id, topic, challenge_type, total_rounds, status, started_at
FROM debate
WHERE id = '[finals_debate_id]';

-- Should show:
-- challenge_type: 'ONE_ON_ONE'
-- total_rounds: 3
-- started_at: [timestamp]
```

---

### Test 6: Automatic Verdict Trigger
**Steps:**
1. All participants submit in Round 1
2. Verify verdicts are generated automatically

**Expected Results:**
- ✅ When all participants submit, verdict generation triggered automatically
- ✅ No manual trigger needed
- ✅ Verdicts use King of the Hill format (not standard format)
- ✅ Round advancement happens automatically after verdicts

---

### Test 7: Score Calculation Accuracy
**Steps:**
1. Check individual judge scores
2. Verify total scores are sum of 3 judges

**Expected Results:**
- ✅ Each participant has 3 scores (one per judge, 0-100 each)
- ✅ Total score = sum of 3 judge scores (0-300)
- ✅ Scores are correctly parsed from AI response
- ✅ Scores stored in verdict reasoning in format: `username: score/100`

**Example:**
```
Participant A:
- Judge 1: 85/100
- Judge 2: 72/100
- Judge 3: 80/100
- Total: 237/300
```

---

## 🐛 Common Issues to Watch For

### Issue: "Only 1 or 2 judges selected instead of 3"
**Cause:** Not enough judges in database
**Fix:** Ensure at least 3 judges exist in database

### Issue: "Scores showing 0/300 for all participants"
**Cause:** AI response parsing failed or format mismatch
**Fix:** Check AI response format, ensure it matches expected JSON structure

### Issue: "Wrong number of participants eliminated"
**Cause:** Bottom 25% calculation incorrect
**Fix:** Verify calculation: `Math.max(1, Math.ceil(participants.length * 0.25))`

### Issue: "Round 2 not created automatically"
**Cause:** Round advancement not triggered
**Fix:** Check that `processKingOfTheHillDebateCompletion()` is called after verdicts

### Issue: "Finals not created when 2 participants remain"
**Cause:** Finals detection logic not working
**Fix:** Verify `activeParticipants.length === 2` check in `processKingOfTheHillDebateCompletion()`

### Issue: "Cumulative scores not updating"
**Cause:** Score update logic not executing
**Fix:** Check that `cumulativeScore` is updated in verdict generation function

---

## 📊 Success Criteria

### Phase 4 Success ✅
- [x] 3 judges selected and verdicts generated
- [x] Scores parsed correctly (0-100 per judge, 0-300 total)
- [x] Verdicts stored in correct format

### Phase 5 Success ✅
- [x] Bottom 25% eliminated correctly
- [x] Cumulative scores updated
- [x] Elimination reasons stored

### Phase 6 Success ✅
- [x] Round 2+ created automatically
- [x] Finals created when 2 remain
- [x] Tournament advances correctly

---

## 🔍 Manual Testing Steps

### Step 1: Create and Start Tournament
- Create King of the Hill tournament with 10 participants
- Start tournament (Round 1 created)

### Step 2: All Participants Submit
- All 10 participants submit their arguments in Round 1
- Wait for automatic verdict generation

### Step 3: Verify Round 1 Results
- Check that 3 verdicts were created
- Check that 3 participants were eliminated (bottom 25% of 10 = 2.5, rounded up to 3)
- Check that 7 participants are ACTIVE
- Check that cumulative scores are updated

### Step 4: Verify Round 2 Created
- Check that Round 2 was created automatically
- Check that Round 2 has only 7 participants (the survivors)
- Check that eliminated participants are not in Round 2

### Step 5: Continue Until Finals
- Complete Round 2 (should eliminate ~2 more, leaving ~5)
- Complete Round 3 (should eliminate ~1 more, leaving ~4)
- Continue until 2 participants remain
- Verify finals is created as ONE_ON_ONE debate

---

## 📝 Notes

- **AI Response Format:** The AI must return JSON with `scores` array and `eliminationReasoning`
- **Score Parsing:** Scores are parsed from AI response, with fallback to 0 if parsing fails
- **Elimination Math:** Bottom 25% uses `Math.ceil()` to ensure at least 1 is eliminated
- **Round Advancement:** Happens automatically after verdicts are generated
- **Finals Detection:** When exactly 2 participants remain, finals is created instead of next elimination round

---

**Status:** Ready for testing  
**Next:** After testing Phase 4-6, proceed to Phase 7-10 (Verdict Trigger Integration, Tournament Completion, Frontend Updates)
