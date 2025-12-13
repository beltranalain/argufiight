# King of the Hill Tournament - Implementation Plan

**Date:** December 13, 2024  
**Status:** 📋 **PLANNING PHASE** - Detailed breakdown before implementation

---

## 🎯 Overview

This document outlines the step-by-step implementation plan for the King of the Hill tournament format. Each phase builds on the previous one, with testing checkpoints to ensure stability.

---

## 📊 Implementation Phases

### **Phase 1: Foundation & Schema** (CRITICAL - Must Complete First)
**Goal:** Enable the format in the system and set up database support

**Tasks:**
1. ✅ Add `KING_OF_THE_HILL` to `TournamentFormat` enum in `prisma/schema.prisma`
2. ✅ Generate Prisma migration: `npx prisma migrate dev --name add_king_of_the_hill_format`
3. ✅ Remove API rejection in `app/api/tournaments/route.ts` (lines 373-379)
4. ✅ Add validation for King of the Hill format (min 3 participants, no power of 2 requirement)
5. ✅ Update `totalRounds` calculation to handle King of the Hill (different from bracket)

**Files to Modify:**
- `prisma/schema.prisma` - Add enum value
- `app/api/tournaments/route.ts` - Remove rejection, add validation

**Files to Create:**
- `prisma/migrations/[timestamp]_add_king_of_the_hill_format/migration.sql` - Auto-generated

**Testing Checkpoint:**
- ✅ Can create tournament with `format: 'KING_OF_THE_HILL'` via API
- ✅ Tournament saved to database with correct format
- ✅ Validation rejects < 3 participants
- ✅ No power of 2 requirement enforced

**Dependencies:** None (foundation)

---

### **Phase 2: Core Round Creation Functions** (CRITICAL)
**Goal:** Create the functions that generate King of the Hill rounds

**Tasks:**
1. ✅ Create `lib/tournaments/king-of-the-hill.ts` file
2. ✅ Implement `createKingOfTheHillRound1(tournamentId: string)`
   - Get all registered participants (status: REGISTERED or ACTIVE)
   - Create TournamentRound (roundNumber: 1)
   - Create single GROUP debate with all participants
   - Create DebateParticipant records for all participants (alternating FOR/AGAINST)
   - Create TournamentMatch record (links debate to round)
   - Set debate: `challengeType: 'GROUP'`, `totalRounds: 1`, `topic: tournament.name`
3. ✅ Implement `createKingOfTheHillRound(tournamentId: string, roundNumber: number)`
   - Get only ACTIVE participants (survivors from previous rounds)
   - Same logic as Round 1, but for subsequent rounds
   - Verify at least 3 participants (or handle 2 for finals)
4. ✅ Implement `createKingOfTheHillFinals(tournamentId: string, roundNumber: number, participants: Array)`
   - Expects exactly 2 participants
   - Create ONE_ON_ONE debate (not GROUP)
   - Set `challengeType: 'ONE_ON_ONE'`, `totalRounds: 3`
   - Set `startedAt: new Date()` (critical for frontend)
   - Create standard 1v1 debate structure
   - Create TournamentMatch record

**Files to Create:**
- `lib/tournaments/king-of-the-hill.ts` - All round creation functions

**Files to Modify:**
- `lib/tournaments/match-generation.ts` - Add King of the Hill handling in `startTournament()`

**Key Logic:**
```typescript
// Round 1: All participants
const participants = tournament.participants.filter(p => 
  p.status === 'REGISTERED' || p.status === 'ACTIVE'
)

// Round 2+: Only ACTIVE (survivors)
const participants = tournament.participants.filter(p => 
  p.status === 'ACTIVE'
)

// Finals: Exactly 2
if (participants.length === 2) {
  createKingOfTheHillFinals(...)
} else {
  createKingOfTheHillRound(...)
}
```

**Testing Checkpoint:**
- ✅ Round 1 creates GROUP debate with all participants
- ✅ All participants have DebateParticipant records
- ✅ Debate has correct challengeType, totalRounds, topic
- ✅ TournamentMatch links debate to round
- ✅ Round 2+ only includes ACTIVE participants
- ✅ Finals creates ONE_ON_ONE debate with startedAt

**Dependencies:** Phase 1 (format must exist)

---

### **Phase 3: Match Generation Integration** (CRITICAL)
**Goal:** Integrate King of the Hill into existing tournament start flow

**Tasks:**
1. ✅ Update `startTournament()` in `lib/tournaments/match-generation.ts`
   - Detect King of the Hill format
   - Call `createKingOfTheHillRound1()` instead of standard match generation
   - Skip standard 1v1 match creation
2. ✅ Update `generateTournamentMatches()` in `lib/tournaments/match-generation.ts`
   - Add early return for King of the Hill (rounds created separately)
   - Prevent standard bracket logic from running

**Files to Modify:**
- `lib/tournaments/match-generation.ts` - Add King of the Hill branches

**Key Changes:**
```typescript
// In startTournament():
if (tournament.format === 'KING_OF_THE_HILL') {
  await createKingOfTheHillRound1(tournamentId)
  return // Don't create standard matches
}

// In generateTournamentMatches():
if (tournament.format === 'KING_OF_THE_HILL') {
  return // Rounds created by createKingOfTheHillRound() functions
}
```

**Testing Checkpoint:**
- ✅ Starting King of the Hill tournament creates Round 1 correctly
- ✅ No 1v1 matches created for King of the Hill
- ✅ Standard formats (BRACKET, CHAMPIONSHIP) still work

**Dependencies:** Phase 2 (round creation functions must exist)

---

### **Phase 4: Verdict Generation System** (CRITICAL)
**Goal:** Create AI verdict generation for King of the Hill rounds

**Tasks:**
1. ✅ Create `lib/tournaments/king-of-the-hill-ai.ts` file
2. ✅ Implement `generateKingOfTheHillRoundVerdicts(debateId, tournamentId, roundNumber)`
   - Get all participants and their submissions from debate
   - Select exactly 3 random judges from database
   - For each judge (in parallel):
     - Call `generateKingOfTheHillVerdict()` with all submissions
     - Parse scores from verdict reasoning
   - Calculate total scores (sum of 3 judges = 0-300 per participant)
   - Rank participants by total score
   - Determine bottom 25% to eliminate
   - Create 3 Verdict records (one per judge)
   - Store scores in reasoning field
3. ✅ Implement `generateKingOfTheHillVerdict(judgeSystemPrompt, topic, submissions, roundNumber)`
   - Build prompt with all participant submissions
   - Call AI (DeepSeek) with special prompt
   - Request format: `username: score/100` for each participant
   - Request elimination reasoning for bottom 25%
   - Parse response and return structured data

**Files to Create:**
- `lib/tournaments/king-of-the-hill-ai.ts` - Verdict generation logic

**Files to Modify:**
- `lib/verdicts/generate-initial.ts` (or create hook) - Trigger King of the Hill verdicts

**Verdict Format:**
```
username1: 85/100
username2: 72/100
username3: 80/100
username4: 65/100

---

Elimination Reasoning: username4 scored lowest with 65/100. Their argument lacked depth and failed to address key counterpoints.
```

**AI Prompt Structure:**
- List all participants and their submissions
- Request individual scores (0-100) for each
- Request identification of bottom 25%
- Request elimination reasoning

**Testing Checkpoint:**
- ✅ 3 judges selected randomly
- ✅ Verdicts generated for all participants
- ✅ Scores parsed correctly (0-100 per judge, 0-300 total)
- ✅ Bottom 25% calculated correctly
- ✅ Elimination reasoning stored

**Dependencies:** Phase 2 (debates must exist), Phase 3 (rounds must be created)

---

### **Phase 5: Elimination & Scoring Logic** (CRITICAL)
**Goal:** Process verdicts, eliminate participants, update scores

**Tasks:**
1. ✅ Implement elimination logic in `generateKingOfTheHillRoundVerdicts()`
   - Calculate: `Math.max(1, Math.ceil(participants.length * 0.25))`
   - Rank participants by total score (highest first)
   - Mark bottom 25% as ELIMINATED:
     - `status: 'ELIMINATED'`
     - `eliminatedAt: new Date()`
     - `eliminationRound: roundNumber`
     - `eliminationReason: [combined from all 3 judges]`
2. ✅ Update cumulative scores
   - For each participant: add round score to `cumulativeScore`
   - `cumulativeScore = (cumulativeScore || 0) + roundTotalScore`
   - Update all participants (both eliminated and active)
3. ✅ Mark remaining participants as ACTIVE
   - Set `status: 'ACTIVE'` for survivors
   - Ensure eliminated participants stay ELIMINATED

**Files to Modify:**
- `lib/tournaments/king-of-the-hill-ai.ts` - Add elimination and scoring logic

**Key Logic:**
```typescript
// Calculate elimination count
const eliminateCount = Math.max(1, Math.ceil(participants.length * 0.25))

// Rank by total score
const ranked = participants.sort((a, b) => b.totalScore - a.totalScore)

// Eliminate bottom 25%
const eliminated = ranked.slice(-eliminateCount)
const survivors = ranked.slice(0, -eliminateCount)

// Update database
for (const participant of eliminated) {
  await prisma.tournamentParticipant.update({
    where: { id: participant.id },
    data: {
      status: 'ELIMINATED',
      eliminatedAt: new Date(),
      eliminationRound: roundNumber,
      eliminationReason: combinedReasoning,
      cumulativeScore: (participant.cumulativeScore || 0) + participant.roundScore
    }
  })
}

for (const participant of survivors) {
  await prisma.tournamentParticipant.update({
    where: { id: participant.id },
    data: {
      status: 'ACTIVE',
      cumulativeScore: (participant.cumulativeScore || 0) + participant.roundScore
    }
  })
}
```

**Testing Checkpoint:**
- ✅ Bottom 25% calculated correctly (test with 4, 8, 10, 16 participants)
- ✅ Participants ranked by score correctly
- ✅ Eliminated participants marked correctly
- ✅ Cumulative scores updated for all participants
- ✅ Elimination reasons stored
- ✅ Survivors marked as ACTIVE

**Dependencies:** Phase 4 (verdicts must be generated)

---

### **Phase 6: Round Advancement Logic** (CRITICAL)
**Goal:** Automatically advance to next round after elimination

**Tasks:**
1. ✅ Implement `processKingOfTheHillDebateCompletion(debateId: string)`
   - Get debate and tournament info
   - Check if verdicts exist (debate status: VERDICT_READY)
   - Call `generateKingOfTheHillRoundVerdicts()` if not already done
   - Process elimination (from Phase 5)
   - Count remaining ACTIVE participants
   - If 2 participants: Call `createKingOfTheHillFinals()`
   - If > 2 participants: Call `createKingOfTheHillRound()` for next round
   - If < 2 participants: Complete tournament (error case)
   - Update tournament `currentRound`
2. ✅ Update `checkAndAdvanceTournamentRound()` in `lib/tournaments/round-advancement.ts`
   - Add King of the Hill branch
   - Check if single GROUP debate is complete
   - Call `processKingOfTheHillDebateCompletion()` instead of standard logic
3. ✅ Update `updateTournamentMatchOnDebateComplete()` in `lib/tournaments/match-completion.ts`
   - Detect King of the Hill format
   - Call `processKingOfTheHillDebateCompletion()` instead of standard logic

**Files to Modify:**
- `lib/tournaments/king-of-the-hill.ts` - Add `processKingOfTheHillDebateCompletion()`
- `lib/tournaments/round-advancement.ts` - Add King of the Hill branch
- `lib/tournaments/match-completion.ts` - Add King of the Hill branch

**Key Logic:**
```typescript
// After verdicts generated and elimination processed:
const activeParticipants = await prisma.tournamentParticipant.findMany({
  where: {
    tournamentId,
    status: 'ACTIVE'
  }
})

if (activeParticipants.length === 2) {
  // Finals
  await createKingOfTheHillFinals(tournamentId, nextRoundNumber, activeParticipants)
} else if (activeParticipants.length > 2) {
  // Next elimination round
  await createKingOfTheHillRound(tournamentId, nextRoundNumber)
} else {
  // Error: Shouldn't happen
  throw new Error('Not enough participants for next round')
}
```

**Testing Checkpoint:**
- ✅ Round 1 completion triggers Round 2 creation
- ✅ Round 2+ completion triggers next round or finals
- ✅ Finals created when 2 participants remain
- ✅ Tournament round number updated correctly
- ✅ Standard formats still work

**Dependencies:** Phase 2 (round creation), Phase 4 (verdicts), Phase 5 (elimination)

---

### **Phase 7: Verdict Trigger Integration** (CRITICAL)
**Goal:** Ensure verdicts are generated automatically when debate completes

**Tasks:**
1. ✅ Update `app/api/debates/[id]/statements/route.ts`
   - Detect King of the Hill GROUP debate
   - When all participants submitted, trigger verdict generation
   - Call `generateKingOfTheHillRoundVerdicts()` instead of standard verdicts
2. ✅ Update `lib/verdicts/generate-initial.ts` (or create hook)
   - Detect if debate is King of the Hill tournament
   - Route to King of the Hill verdict generation if applicable
3. ✅ Ensure verdict generation triggers round advancement
   - After verdicts generated, call `processKingOfTheHillDebateCompletion()`
   - Or ensure `updateTournamentMatchOnDebateComplete()` is called

**Files to Modify:**
- `app/api/debates/[id]/statements/route.ts` - Add King of the Hill detection
- `lib/verdicts/generate-initial.ts` - Route to King of the Hill verdicts (or create separate hook)

**Key Logic:**
```typescript
// In statements route, after all submissions:
const isKingOfTheHill = debate.tournamentMatch?.tournament?.format === 'KING_OF_THE_HILL'

if (isKingOfTheHill && allParticipantsSubmitted) {
  // Generate King of the Hill verdicts
  await generateKingOfTheHillRoundVerdicts(debateId, tournamentId, roundNumber)
  // This will also process elimination and advance round
}
```

**Testing Checkpoint:**
- ✅ Verdicts generated when all participants submit
- ✅ Verdicts use 3 judges (not 7)
- ✅ Round advancement triggered automatically
- ✅ Standard debates still use standard verdicts

**Dependencies:** Phase 4 (verdict generation), Phase 6 (round advancement)

---

### **Phase 8: Tournament Completion & Winner Takes All** (HIGH)
**Goal:** Complete tournament and implement "winner takes all" scoring

**Tasks:**
1. ✅ Update `completeTournament()` in `lib/tournaments/tournament-completion.ts`
   - Add King of the Hill branch
   - Find champion (winner of finals or last ACTIVE participant)
   - Calculate "winner takes all":
     - Sum all `cumulativeScore` from ELIMINATED participants
     - Add to champion's `cumulativeScore`
   - Mark tournament as COMPLETED
   - Create completion notifications
2. ✅ Ensure finals completion triggers tournament completion
   - When finals debate completes, call `completeTournament()`
   - Verify champion is correctly identified

**Files to Modify:**
- `lib/tournaments/tournament-completion.ts` - Add "winner takes all" logic

**Key Logic:**
```typescript
if (tournament.format === 'KING_OF_THE_HILL') {
  // Winner takes all
  const eliminated = tournament.participants.filter(p => p.status === 'ELIMINATED')
  const totalEliminatedScore = eliminated.reduce(
    (sum, p) => sum + (p.cumulativeScore || 0),
    0
  )
  
  await prisma.tournamentParticipant.update({
    where: { id: champion.id },
    data: {
      cumulativeScore: (champion.cumulativeScore || 0) + totalEliminatedScore
    }
  })
}
```

**Testing Checkpoint:**
- ✅ Tournament completes after finals
- ✅ Champion receives all eliminated participants' scores
- ✅ Champion's cumulative score updated correctly
- ✅ Tournament marked as COMPLETED
- ✅ Notifications created

**Dependencies:** Phase 2 (finals creation), Phase 5 (cumulative scores), Phase 6 (round advancement)

---

### **Phase 9: Frontend - Debate Page Updates** (MEDIUM)
**Goal:** Display GROUP debates correctly in the debate page

**Tasks:**
1. ✅ Update `app/(dashboard)/debate/[id]/page.tsx`
   - Detect GROUP challenge type for King of the Hill
   - Show all participants (not just challenger/opponent)
   - Display all submissions simultaneously
   - Show cumulative scores for each participant
   - Display elimination status (if eliminated)
   - Show elimination reasons (if applicable)
2. ✅ Ensure submission works for all participants
   - Verify `DebateParticipant` records allow submission
   - Show "Your Turn" for all participants (GROUP = simultaneous)

**Files to Modify:**
- `app/(dashboard)/debate/[id]/page.tsx` - Add GROUP challenge display

**Key Changes:**
- Show participant list instead of just challenger/opponent
- Display cumulative scores
- Show elimination badges
- Allow all participants to submit

**Testing Checkpoint:**
- ✅ All participants visible in GROUP debate
- ✅ All participants can submit
- ✅ Cumulative scores displayed
- ✅ Elimination status shown
- ✅ Standard 1v1 debates still work

**Dependencies:** Phase 2 (GROUP debates created), Phase 5 (cumulative scores)

---

### **Phase 10: Frontend - Tournament Bracket Display** (MEDIUM)
**Goal:** Display King of the Hill tournament bracket correctly

**Tasks:**
1. ✅ Update `components/tournaments/TournamentBracket.tsx`
   - Detect King of the Hill format
   - For elimination rounds: Show single "Open Debate" card with all participants
   - Show eliminated participants in RED with "✗ Eliminated" badge
   - Show active participants normally
   - Display cumulative scores
   - For finals: Show traditional 1v1 match card
2. ✅ Update tournament detail page
   - Show cumulative scores for all participants
   - Display elimination round and reason for eliminated participants
   - Show "Winner Takes All" bonus for champion

**Files to Modify:**
- `components/tournaments/TournamentBracket.tsx` - Add King of the Hill display
- `app/(dashboard)/tournaments/[id]/page.tsx` - Add cumulative scores display

**Key Changes:**
- Grid layout for GROUP rounds
- Traditional bracket for finals
- Score display
- Elimination indicators

**Testing Checkpoint:**
- ✅ Round 1-2+ show as GROUP debate card
- ✅ Finals show as 1v1 match card
- ✅ Eliminated participants shown in RED
- ✅ Cumulative scores displayed
- ✅ Elimination reasons shown
- ✅ Standard brackets still work

**Dependencies:** Phase 2 (rounds created), Phase 5 (scores tracked), Phase 8 (completion)

---

## 🔄 Implementation Flow

```
Phase 1 (Foundation)
    ↓
Phase 2 (Round Creation)
    ↓
Phase 3 (Match Generation Integration)
    ↓
Phase 4 (Verdict Generation)
    ↓
Phase 5 (Elimination & Scoring)
    ↓
Phase 6 (Round Advancement)
    ↓
Phase 7 (Verdict Trigger)
    ↓
Phase 8 (Tournament Completion)
    ↓
Phase 9 (Frontend - Debate Page)
    ↓
Phase 10 (Frontend - Bracket Display)
```

---

## 🧪 Testing Strategy

### Unit Testing (Per Phase)
- Test each function in isolation
- Mock database calls
- Verify logic correctness

### Integration Testing (After Each Phase)
- Test phase with real database
- Verify data is stored correctly
- Check error handling

### End-to-End Testing (After All Phases)
- Create full tournament
- Complete all rounds
- Verify winner takes all
- Check frontend display

### Edge Cases to Test
- 3 participants (minimum)
- 4 participants (exact 25% = 1 eliminated)
- 5 participants (25% = 1.25, rounds up to 2?)
- 10 participants (25% = 2.5, rounds up to 3)
- Participant drops out mid-tournament
- Verdict generation fails
- Round advancement fails

---

## 📝 Files Summary

### Files to Create
1. `lib/tournaments/king-of-the-hill.ts` - Round creation functions
2. `lib/tournaments/king-of-the-hill-ai.ts` - Verdict generation
3. `prisma/migrations/[timestamp]_add_king_of_the_hill_format/migration.sql` - Schema migration

### Files to Modify
1. `prisma/schema.prisma` - Add enum value
2. `app/api/tournaments/route.ts` - Remove rejection, add validation
3. `lib/tournaments/match-generation.ts` - Add King of the Hill branches
4. `lib/tournaments/round-advancement.ts` - Add King of the Hill branch
5. `lib/tournaments/match-completion.ts` - Add King of the Hill branch
6. `lib/tournaments/tournament-completion.ts` - Add winner takes all
7. `app/api/debates/[id]/statements/route.ts` - Trigger King of the Hill verdicts
8. `app/(dashboard)/debate/[id]/page.tsx` - GROUP challenge display
9. `components/tournaments/TournamentBracket.tsx` - King of the Hill bracket
10. `app/(dashboard)/tournaments/[id]/page.tsx` - Cumulative scores display

---

## ⚠️ Critical Dependencies

1. **Phase 1 must complete first** - Format must exist before anything else
2. **Phase 2 before Phase 3** - Round creation functions needed for integration
3. **Phase 4 before Phase 5** - Verdicts needed for elimination
4. **Phase 5 before Phase 6** - Elimination needed for advancement
5. **Phase 6 before Phase 7** - Advancement logic needed for triggers
6. **Phase 8 depends on all previous** - Completion needs everything working

---

## 🎯 Success Criteria

### Phase 1 Success
- ✅ Can create King of the Hill tournament via API
- ✅ Database stores format correctly

### Phase 2-3 Success
- ✅ Round 1 creates GROUP debate with all participants
- ✅ Participants can see and access debate

### Phase 4-5 Success
- ✅ Verdicts generated with 3 judges
- ✅ Bottom 25% eliminated correctly
- ✅ Cumulative scores updated

### Phase 6-7 Success
- ✅ Round 2+ created automatically
- ✅ Finals created when 2 remain
- ✅ Tournament advances correctly

### Phase 8 Success
- ✅ Tournament completes after finals
- ✅ Winner takes all implemented
- ✅ Champion score updated

### Phase 9-10 Success
- ✅ Frontend displays GROUP debates
- ✅ Scores and elimination shown
- ✅ Bracket displays correctly

---

## 🚀 Estimated Timeline

- **Phase 1:** 30 minutes (schema + API)
- **Phase 2:** 2-3 hours (round creation functions)
- **Phase 3:** 1 hour (integration)
- **Phase 4:** 3-4 hours (verdict generation)
- **Phase 5:** 2 hours (elimination logic)
- **Phase 6:** 2-3 hours (round advancement)
- **Phase 7:** 1-2 hours (verdict triggers)
- **Phase 8:** 1 hour (completion)
- **Phase 9:** 2-3 hours (debate page)
- **Phase 10:** 2-3 hours (bracket display)

**Total Estimated Time:** 18-24 hours

---

## 📋 Pre-Implementation Checklist

Before starting implementation:
- [ ] Review scope document thoroughly
- [ ] Understand existing tournament system (BRACKET, CHAMPIONSHIP)
- [ ] Understand GROUP challenge type (if it exists)
- [ ] Understand DebateParticipant table structure
- [ ] Understand verdict generation system
- [ ] Set up test database
- [ ] Create test tournament data

---

**Last Updated:** December 13, 2024  
**Status:** Ready for implementation approval
