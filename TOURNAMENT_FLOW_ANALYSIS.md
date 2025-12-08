# Tournament Flow Analysis

## Current Implementation Status

### ✅ **IMPLEMENTED:**

1. **Tournament Creation**
   - Users can create tournaments
   - Creator is automatically added as participant (seed 1)
   - Usage tracking (counts when first non-creator joins)

2. **Participant Registration**
   - Users can join tournaments
   - ELO requirements checked
   - Seeding assigned (creator = 1, others increment)
   - Status changes from `UPCOMING` → `REGISTRATION_OPEN` when first person joins

3. **Auto-Start When Full**
   - When tournament reaches `maxParticipants`, it auto-starts
   - Status changes to `IN_PROGRESS`
   - First round matches are generated (bracket seeding: 1 vs 4, 2 vs 3)
   - Debates are created for each match
   - Matches are linked to debates

### ❌ **MISSING - CRITICAL GAPS:**

## The Complete Flow (What Should Happen)

### Phase 1: Tournament Start ✅
1. Tournament created → `UPCOMING`
2. First participant joins → `REGISTRATION_OPEN`
3. Tournament fills up (4/4) → `IN_PROGRESS`
4. Round 1 matches generated:
   - Match 1: Seed 1 vs Seed 4
   - Match 2: Seed 2 vs Seed 3
5. Debates created and linked to matches
6. Participants can start debating

### Phase 2: Debate Execution ✅ (Regular Debate System)
1. Participants submit arguments
2. Debate progresses through rounds
3. When debate completes → `COMPLETED`
4. Verdict generation triggered → `VERDICT_READY`
5. Winner determined (challenger or opponent)
6. ELO updated for both participants

### Phase 3: Match Completion ❌ **MISSING**
**When a debate linked to a tournament match completes:**
1. ❌ **NOT IMPLEMENTED**: Check if debate has a `tournamentMatch` relation
2. ❌ **NOT IMPLEMENTED**: Update `TournamentMatch.winnerId` based on debate winner
3. ❌ **NOT IMPLEMENTED**: Update `TournamentMatch.status` to `COMPLETED`
4. ❌ **NOT IMPLEMENTED**: Update `TournamentMatch.completedAt`
5. ❌ **NOT IMPLEMENTED**: Update participant stats:
   - Winner: `wins++`, status → `ACTIVE`
   - Loser: `losses++`, status → `ELIMINATED`
6. ❌ **NOT IMPLEMENTED**: Check if all matches in round are complete

### Phase 4: Round Completion ❌ **MISSING**
**When all matches in a round complete:**
1. ❌ **NOT IMPLEMENTED**: Update `TournamentRound.status` to `COMPLETED`
2. ❌ **NOT IMPLEMENTED**: Check if this is the final round:
   - If final round → Tournament complete (see Phase 5)
   - If not final round → Generate next round (see Phase 6)

### Phase 5: Tournament Completion ❌ **MISSING**
**When final round completes:**
1. ❌ **NOT IMPLEMENTED**: Determine tournament champion (last remaining participant)
2. ❌ **NOT IMPLEMENTED**: Update `Tournament.status` to `COMPLETED`
3. ❌ **NOT IMPLEMENTED**: Update `Tournament.endDate`
4. ❌ **NOT IMPLEMENTED**: Update final participant status to `ACTIVE` (champion)
5. ❌ **NOT IMPLEMENTED**: Create notifications for all participants

### Phase 6: Next Round Generation ❌ **PARTIALLY IMPLEMENTED**
**When a round completes and it's not the final round:**
1. ✅ **IMPLEMENTED**: `generateTournamentMatches()` function exists
2. ❌ **NOT IMPLEMENTED**: Logic to call it when round completes
3. ❌ **NOT IMPLEMENTED**: Reseeding logic (if `reseedAfterRound` is true)
4. ❌ **NOT IMPLEMENTED**: Update `Tournament.currentRound++`
5. ❌ **NOT IMPLEMENTED**: Create new `TournamentRound` for next round
6. ❌ **NOT IMPLEMENTED**: Generate matches for next round
7. ❌ **NOT IMPLEMENTED**: Create debates for new matches

## Score/ELO Updates

### ✅ **IMPLEMENTED (Regular Debates):**
- When debate completes, ELO is updated for both participants
- Winner gains ELO, loser loses ELO
- This happens in `lib/verdicts/generate-initial.ts`

### ❌ **MISSING (Tournament-Specific):**
- Tournament participants have `eloAtStart` stored
- But there's no logic to:
  - Track tournament-specific ELO changes
  - Update participant `wins` and `losses` counters
  - Mark participants as `ELIMINATED` when they lose

## What Happens When Someone Wins a Round

**Current State:** ❌ **NOTHING HAPPENS**

**What Should Happen:**
1. Debate completes → `VERDICT_READY`
2. **NEW**: Check if debate has `tournamentMatch` relation
3. **NEW**: Find the `TournamentMatch` record
4. **NEW**: Determine which participant won:
   - If `debate.winnerId === debate.challengerId` → `participant1` won
   - If `debate.winnerId === debate.opponentId` → `participant2` won
5. **NEW**: Update `TournamentMatch`:
   ```typescript
   await prisma.tournamentMatch.update({
     where: { id: matchId },
     data: {
       winnerId: winningParticipant.id,
       status: 'COMPLETED',
       completedAt: new Date(),
     }
   })
   ```
6. **NEW**: Update participant stats:
   ```typescript
   // Winner
   await prisma.tournamentParticipant.update({
     where: { id: winningParticipant.id },
     data: {
       wins: { increment: 1 },
       status: 'ACTIVE',
     }
   })
   
   // Loser
   await prisma.tournamentParticipant.update({
     where: { id: losingParticipant.id },
     data: {
       losses: { increment: 1 },
       status: 'ELIMINATED',
       eliminatedAt: new Date(),
     }
   })
   ```
7. **NEW**: Check if all matches in round are complete
8. **NEW**: If all complete, advance to next round or complete tournament

## How It Moves to Next Round

**Current State:** ❌ **DOESN'T MOVE**

**What Should Happen:**
1. **NEW**: When all matches in a round have `status: 'COMPLETED'`
2. **NEW**: Update `TournamentRound.status` to `COMPLETED`
3. **NEW**: Check if `currentRound >= totalRounds`:
   - If yes → Complete tournament (Phase 5)
   - If no → Generate next round (Phase 6)
4. **NEW**: For next round:
   - Get all winners from previous round
   - If `reseedAfterRound` is true, reseed based on `reseedMethod`:
     - `ELO_BASED`: Reseed by current ELO
     - `TOURNAMENT_WINS`: Reseed by tournament wins
     - `RANDOM`: Random reseeding
   - Generate bracket matches (pair winners)
   - Create new `TournamentRound`
   - Create `TournamentMatch` records
   - Create debates for each match
   - Update `Tournament.currentRound++`

## What Happens When Winner Wins

**Current State:** ❌ **NOTHING HAPPENS**

**What Should Happen:**
1. Final round completes
2. Last match has a winner
3. **NEW**: Update `Tournament.status` to `COMPLETED`
4. **NEW**: Update `Tournament.endDate`
5. **NEW**: Mark champion as `ACTIVE` (they're the only one left)
6. **NEW**: Create notifications for all participants
7. **NEW**: Display tournament results

## Summary of Missing Implementation

### Critical Missing Functions:

1. **`updateTournamentMatchOnDebateComplete(debateId: string)`**
   - Called when debate reaches `VERDICT_READY`
   - Updates match winner, status, completion time
   - Updates participant wins/losses
   - Checks if round is complete

2. **`checkAndAdvanceTournamentRound(tournamentId: string, roundNumber: number)`**
   - Checks if all matches in round are complete
   - If complete, either:
     - Generate next round (if not final)
     - Complete tournament (if final)

3. **`completeTournament(tournamentId: string)`**
   - Marks tournament as `COMPLETED`
   - Sets end date
   - Marks champion
   - Creates notifications

4. **`reseedTournamentParticipants(tournamentId: string, method: ReseedMethod)`**
   - Reseeds participants based on method
   - Updates `seed` and `currentSeed` fields

### Integration Points:

1. **In `lib/verdicts/generate-initial.ts`**:
   - After verdict is generated and debate is updated to `VERDICT_READY`
   - Check if debate has `tournamentMatch`
   - If yes, call `updateTournamentMatchOnDebateComplete()`

2. **In `updateTournamentMatchOnDebateComplete()`**:
   - After updating match and participants
   - Call `checkAndAdvanceTournamentRound()`

3. **In `checkAndAdvanceTournamentRound()`**:
   - If round complete and not final → Generate next round
   - If round complete and final → Complete tournament

## Why Your Tournament Isn't Working

1. ✅ Tournament starts correctly (matches and debates created)
2. ✅ Debates can be completed
3. ❌ **When debate completes, nothing updates the tournament match**
4. ❌ **Tournament match winner is never set**
5. ❌ **Participant wins/losses are never updated**
6. ❌ **Round never completes**
7. ❌ **Next round never generates**
8. ❌ **Tournament never completes**

**The missing link:** There's no hook between debate completion and tournament match updates.

