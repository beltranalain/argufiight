# Tournament Championship Format - Implementation Plan

## 🎯 What We're Implementing

### Complete Championship Format System
1. ✅ **Position Selection System** - Users choose PRO or CON when joining
2. ✅ **Score-Based Advancement** - Advancement by individual scores, not match wins
3. ✅ **Consistent Judge Assignment** - Same 7 judges for all Round 1 matches
4. ✅ **Score Storage & Extraction** - Store individual scores per match
5. ✅ **Tiebreaker Logic** - Complete tiebreaker chain
6. ✅ **Position Balance Enforcement** - Tournament can't start until positions are balanced
7. ✅ **Championship-Specific UI** - Position selection, score displays, advancement views

### Critical Logic Issues Being Fixed
- ✅ **Issue 1**: Current system advances winners only → **FIXED**: Score-based advancement within position groups
- ✅ **Issue 2**: No position selection → **FIXED**: Users select PRO/CON during registration
- ✅ **Issue 3**: No score storage → **FIXED**: Extract and store scores when debate completes
- ✅ **Issue 4**: Different judges per match → **FIXED**: Assign same 7 judges to all Round 1 matches
- ✅ **Issue 5**: No tiebreaker logic → **FIXED**: Complete tiebreaker chain implementation

---

## 📋 Phase Breakdown

### **PHASE 1: Database Schema & Foundation** (Day 1)
**Goal**: Set up database structure to support Championship format

#### Tasks:
1. **Add TournamentFormat Enum**
   ```prisma
   enum TournamentFormat {
     BRACKET      // Current system (default)
     CHAMPIONSHIP // New format
   }
   ```

2. **Update Tournament Model**
   ```prisma
   model Tournament {
     format         TournamentFormat @default(BRACKET)
     assignedJudges String?          // JSON array of judge IDs
   }
   ```

3. **Update TournamentParticipant Model**
   ```prisma
   model TournamentParticipant {
     selectedPosition String? // 'PRO' or 'CON'
     registeredAt     DateTime @default(now())
   }
   ```

4. **Update TournamentMatch Model**
   ```prisma
   model TournamentMatch {
     participant1Score         Int?    // 0-100
     participant2Score         Int?    // 0-100
     participant1ScoreBreakdown Json?  // { judgeId: score }
     participant2ScoreBreakdown Json?  // { judgeId: score }
   }
   ```

5. **Create Migration**
   - Generate Prisma migration
   - Test migration on local database
   - Ensure backwards compatibility (all fields nullable/default)

**Deliverables:**
- ✅ Updated `prisma/schema.prisma`
- ✅ Migration file created
- ✅ Database updated

**Testing:**
- Verify existing tournaments still work (backwards compatibility)
- Verify new fields are nullable/default correctly

---

### **PHASE 2: Tournament Creation & Format Selection** (Day 1-2)
**Goal**: Allow users to create Championship format tournaments

#### Tasks:
1. **Update Tournament Creation API** (`app/api/tournaments/route.ts`)
   - Add `format` field to POST request
   - Validate format (BRACKET or CHAMPIONSHIP)
   - If Championship: Require creator to select position
   - Store creator's selected position in `TournamentParticipant`

2. **Update Tournament Creation UI** (`app/(dashboard)/tournaments/create/page.tsx`)
   - Add format selection radio buttons (Bracket / Championship)
   - Show position selection if Championship selected
   - Display format explanation/help text
   - Update form validation

3. **Update Tournament Detail Page** (`app/(dashboard)/tournaments/[id]/page.tsx`)
   - Display tournament format
   - Show position slots if Championship format
   - Display position balance status

**Deliverables:**
- ✅ Tournament creation supports format selection
- ✅ Creator can select position for Championship tournaments
- ✅ UI shows format and position information

**Testing:**
- Create Bracket tournament (should work as before)
- Create Championship tournament with position selection
- Verify creator's position is stored correctly

---

### **PHASE 3: Position Selection & Registration** (Day 2)
**Goal**: Users select PRO or CON when joining Championship tournaments

#### Tasks:
1. **Update Join Tournament API** (`app/api/tournaments/[id]/join/route.ts`)
   - Check if tournament is Championship format
   - If Championship: Require `selectedPosition` in request body
   - Validate position balance (can't join if position is full)
   - Store `selectedPosition` in `TournamentParticipant`
   - Block tournament start if positions are unbalanced

2. **Create Position Selection Component** (`components/tournaments/PositionSelector.tsx`)
   - Show available positions (PRO/CON)
   - Display slots filled/available for each position
   - Disable full positions
   - Show position balance status

3. **Update Tournament Join UI** (`app/(dashboard)/tournaments/[id]/page.tsx`)
   - Show position selector modal when joining Championship tournament
   - Display position slots in tournament detail
   - Show "Waiting for X more PRO/CON debaters" message
   - Disable start if positions unbalanced

4. **Update Tournament List** (`app/(dashboard)/tournaments/page.tsx`)
   - Show format badge (Bracket / Championship)
   - Display position balance in tournament cards

**Deliverables:**
- ✅ Users can select position when joining
- ✅ Position balance is enforced
- ✅ Tournament can't start until balanced
- ✅ UI clearly shows position slots

**Testing:**
- Join Championship tournament and select position
- Try to join full position (should be blocked)
- Verify unbalanced tournament can't start
- Test position balance validation

---

### **PHASE 4: Judge Assignment & Match Generation** (Day 2-3)
**Goal**: Assign same 7 judges to all Round 1 matches (Championship format)

#### Tasks:
1. **Update Match Generation** (`lib/tournaments/match-generation.ts`)
   - Check tournament format
   - If Championship Round 1:
     - Select 7 judges randomly
     - Store in `Tournament.assignedJudges` (JSON array)
     - Pair PRO with CON only (no PRO vs PRO or CON vs CON)
     - Random or seeded pairing within PRO vs CON constraint
   - If Bracket format: Use existing logic (no changes)

2. **Update Tournament Start** (`lib/tournaments/match-generation.ts` - `startTournament`)
   - If Championship format: Assign judges before creating matches
   - Store assigned judges in tournament
   - Use same judges for all Round 1 debates

3. **Update Debate Creation** (`lib/tournaments/match-generation.ts`)
   - If Championship Round 1: Use assigned judges
   - Pass judge IDs to verdict generation
   - Ensure same judges are used for all Round 1 matches

**Deliverables:**
- ✅ Same 7 judges assigned to all Round 1 matches (Championship)
- ✅ PRO vs CON pairing only in Round 1
- ✅ Judge assignment stored in tournament

**Testing:**
- Start Championship tournament
- Verify same 7 judges are assigned
- Verify all Round 1 matches use same judges
- Verify PRO vs CON pairing only

---

### **PHASE 5: Score Extraction & Storage** (Day 3-4)
**Goal**: Extract individual scores from verdicts and store in TournamentMatch

#### Tasks:
1. **Update Match Completion** (`lib/tournaments/match-completion.ts`)
   - When debate completes and verdicts are generated:
     - Extract individual scores from verdicts
     - Calculate average score per participant
     - Store in `TournamentMatch.participant1Score` and `participant2Score`
     - Store judge breakdown in JSON fields
     - Keep `winnerId` for tiebreaker purposes

2. **Update Verdict Generation Hook** (`lib/verdicts/generate-initial.ts`)
   - After verdicts are generated:
     - Check if debate is part of tournament match
     - If Championship format: Extract scores and store in match
     - Calculate average of all judge scores per participant

3. **Score Calculation Logic**
   ```typescript
   // Extract scores from verdicts
   const verdicts = await prisma.verdict.findMany({
     where: { debateId }
   })
   
   // Calculate challenger average
   const challengerScores = verdicts.map(v => v.challengerScore).filter(Boolean)
   const challengerAvg = challengerScores.reduce((a, b) => a + b, 0) / challengerScores.length
   
   // Calculate opponent average
   const opponentScores = verdicts.map(v => v.opponentScore).filter(Boolean)
   const opponentAvg = opponentScores.reduce((a, b) => a + b, 0) / opponentScores.length
   
   // Store in match
   await prisma.tournamentMatch.update({
     where: { id: matchId },
     data: {
       participant1Score: challengerAvg,
       participant2Score: opponentAvg,
       participant1ScoreBreakdown: { /* judge breakdown */ },
       participant2ScoreBreakdown: { /* judge breakdown */ }
     }
   })
   ```

**Deliverables:**
- ✅ Individual scores extracted from verdicts
- ✅ Scores stored in TournamentMatch
- ✅ Judge breakdown stored in JSON fields
- ✅ Average scores calculated correctly

**Testing:**
- Complete a Championship tournament debate
- Verify scores are extracted and stored
- Verify score breakdowns are correct
- Test with different numbers of judges

---

### **PHASE 6: Score-Based Advancement Logic** (Day 4-5)
**Goal**: Implement advancement based on individual scores within position groups

#### Tasks:
1. **Create Advancement Logic** (`lib/tournaments/championship-advancement.ts`)
   - New file for Championship-specific advancement
   - Function: `calculateChampionshipAdvancement(tournamentId, roundNumber)`
   - Group participants by position (PRO vs CON)
   - Sort by score within each position group
   - Select top N from each position (N = 50% of participants per position)
   - Apply tiebreakers if scores are tied

2. **Tiebreaker Implementation**
   ```typescript
   function applyTiebreakers(participant1, participant2) {
     // 1. Match winner (if one won and one lost)
     if (participant1.matchWon && !participant2.matchWon) return participant1
     if (participant2.matchWon && !participant1.matchWon) return participant2
     
     // 2. Score differential (who won/lost by more points)
     const diff1 = participant1.scoreDifferential
     const diff2 = participant2.scoreDifferential
     if (diff1 !== diff2) return diff1 > diff2 ? participant1 : participant2
     
     // 3. Higher ELO rating
     if (participant1.eloRating !== participant2.eloRating) {
       return participant1.eloRating > participant2.eloRating ? participant1 : participant2
     }
     
     // 4. Earlier registration time
     return participant1.registeredAt < participant2.registeredAt ? participant1 : participant2
   }
   ```

3. **Update Round Advancement** (`lib/tournaments/round-advancement.ts`)
   - Check tournament format
   - If Championship: Use score-based advancement
   - If Bracket: Use existing winner-based advancement
   - After Round 1: Group by position, sort by score, advance top N
   - Subsequent rounds: Continue elimination until Finals

4. **Update Match Completion** (`lib/tournaments/match-completion.ts`)
   - After storing scores: Check if round is complete
   - If Championship Round 1: Trigger score-based advancement
   - If other rounds: Use appropriate advancement logic

**Deliverables:**
- ✅ Score-based advancement for Championship format
- ✅ Position grouping and sorting
- ✅ Top N selection from each position
- ✅ Complete tiebreaker chain

**Testing:**
- Complete Round 1 of Championship tournament
- Verify advancement is based on scores, not match wins
- Test tiebreaker scenarios
- Verify "lose but advance" scenario works

---

### **PHASE 7: Round Advancement & Finals** (Day 5)
**Goal**: Handle subsequent rounds and ensure Finals has opposite positions

#### Tasks:
1. **Update Round Advancement** (`lib/tournaments/round-advancement.ts`)
   - After Round 1 (Championship):
     - Use score-based advancement
     - Generate Round 2 matches (winners face each other)
   - Subsequent rounds:
     - Continue elimination bracket
     - Ensure Finals always has opposite positions
   - Verify Finals matchup is PRO vs CON

2. **Finals Generation**
   - Ensure Finals has exactly 2 participants
   - Verify they have opposite positions
   - If not opposite: Error handling (shouldn't happen with correct logic)

3. **Tournament Completion** (`lib/tournaments/tournament-completion.ts`)
   - Verify champion is determined correctly
   - Send notifications to all participants
   - Update tournament status

**Deliverables:**
- ✅ Round advancement works for all rounds
- ✅ Finals always has opposite positions
- ✅ Tournament completion works correctly

**Testing:**
- Test 4-person Championship tournament (1 round + finals)
- Test 8-person Championship tournament (2 rounds + finals)
- Verify Finals has opposite positions
- Test tournament completion

---

### **PHASE 8: UI Components & User Experience** (Day 6-7)
**Goal**: Create Championship-specific UI components

#### Tasks:
1. **Position Selection Component** (`components/tournaments/PositionSelector.tsx`)
   - Modal/dropdown for selecting PRO or CON
   - Show slots available for each position
   - Disable full positions
   - Visual feedback

2. **Championship Rules Modal** (`components/tournaments/ChampionshipRulesModal.tsx`)
   - Explain Championship format
   - Show how advancement works
   - Explain "lose but advance" concept
   - Accessible from tournament detail page

3. **Advancement Display** (`components/tournaments/AdvancementDisplay.tsx`)
   - Show who advanced after Round 1
   - Display scores within position groups
   - Highlight "lost but advanced" scenarios
   - Show tiebreaker information if applicable

4. **Position Comparison Table** (`components/tournaments/PositionComparisonTable.tsx`)
   - Show all participants grouped by position
   - Display scores for each participant
   - Show who advanced and why
   - Visual indicators for advancement

5. **Score Display Updates**
   - Show individual scores in match cards
   - Display score breakdowns
   - Show position-based rankings

6. **Tournament Bracket Updates** (`components/tournaments/TournamentBracket.tsx`)
   - Show position information
   - Display scores next to participants
   - Highlight score-based advancement
   - Show "lost but advanced" indicators

**Deliverables:**
- ✅ Position selection UI
- ✅ Championship rules explanation
- ✅ Advancement display components
- ✅ Score visualization
- ✅ Updated bracket visualization

**Testing:**
- Test position selection flow
- Verify UI displays scores correctly
- Test advancement display
- Verify all Championship-specific UI works

---

### **PHASE 9: Edge Cases & Error Handling** (Day 7-8)
**Goal**: Handle all edge cases and error scenarios

#### Tasks:
1. **Unbalanced Positions**
   - Block tournament start if unbalanced
   - Show clear error messages
   - Allow host to kick participants to rebalance
   - Auto-cancel if not filled within 7 days

2. **User Abandons Match**
   - Forfeiter gets 0/100 score
   - Opponent wins by forfeit
   - Forfeiter cannot advance
   - Handle gracefully in advancement logic

3. **All Same-Position Debaters Score Identically**
   - Apply all tiebreakers in order
   - Ultimate fallback: Random selection (with logging)
   - Notify participants of tiebreaker usage

4. **Rematch Scenarios**
   - Allow same people to face each other again
   - Show "Rematch" indicator in UI
   - Handle correctly in bracket visualization

5. **Tournament Host Abandons**
   - Tournament continues (host treated as normal participant)
   - System automatically manages tournament
   - No special handling needed

6. **Judge Assignment Failures**
   - Fallback if not enough judges available
   - Error handling for judge assignment
   - Logging for debugging

**Deliverables:**
- ✅ All edge cases handled
- ✅ Clear error messages
- ✅ Graceful degradation
- ✅ Comprehensive logging

**Testing:**
- Test unbalanced position scenarios
- Test forfeit scenarios
- Test tiebreaker edge cases
- Test rematch scenarios
- Test error conditions

---

### **PHASE 10: Testing & Polish** (Day 8-10)
**Goal**: Comprehensive testing and final polish

#### Tasks:
1. **Integration Testing**
   - Test complete Championship tournament flow (4-person)
   - Test complete Championship tournament flow (8-person)
   - Test mixed format tournaments (Bracket and Championship)
   - Test backwards compatibility (existing Bracket tournaments)

2. **User Acceptance Testing**
   - Test position selection flow
   - Test score-based advancement
   - Test "lose but advance" scenario
   - Test tiebreaker scenarios
   - Test UI/UX flow

3. **Performance Testing**
   - Test with large tournaments (32, 64 participants)
   - Verify score calculations are efficient
   - Check database query performance
   - Optimize if needed

4. **Documentation**
   - Update tournament user guide
   - Document Championship format rules
   - Update API documentation
   - Create developer notes

5. **Bug Fixes & Polish**
   - Fix any bugs found during testing
   - Improve error messages
   - Enhance UI/UX
   - Add loading states
   - Improve visual feedback

**Deliverables:**
- ✅ All tests passing
- ✅ Documentation updated
- ✅ Bugs fixed
- ✅ UI polished
- ✅ Ready for production

**Testing:**
- Full end-to-end testing
- User acceptance testing
- Performance testing
- Edge case testing

---

## 📊 Implementation Summary

### Total Estimated Time: **8-10 Days**

### Phase Breakdown:
- **Phase 1**: Database Schema (Day 1) - 4-6 hours
- **Phase 2**: Tournament Creation (Day 1-2) - 4-6 hours
- **Phase 3**: Position Selection (Day 2) - 4-6 hours
- **Phase 4**: Judge Assignment (Day 2-3) - 4-6 hours
- **Phase 5**: Score Storage (Day 3-4) - 6-8 hours
- **Phase 6**: Advancement Logic (Day 4-5) - 8-10 hours
- **Phase 7**: Round Advancement (Day 5) - 4-6 hours
- **Phase 8**: UI Components (Day 6-7) - 8-10 hours
- **Phase 9**: Edge Cases (Day 7-8) - 6-8 hours
- **Phase 10**: Testing & Polish (Day 8-10) - 8-12 hours

### Critical Logic Issues - All Addressed:
- ✅ **Issue 1**: Score-based advancement (Phase 6)
- ✅ **Issue 2**: Position selection (Phase 3)
- ✅ **Issue 3**: Score storage (Phase 5)
- ✅ **Issue 4**: Consistent judges (Phase 4)
- ✅ **Issue 5**: Tiebreaker logic (Phase 6)

---

## 🚀 Ready to Start?

This plan addresses all critical logic issues and provides a clear, phased approach to implementation. Each phase builds on the previous one, ensuring a solid foundation.

**Would you like me to start with Phase 1 (Database Schema)?**

