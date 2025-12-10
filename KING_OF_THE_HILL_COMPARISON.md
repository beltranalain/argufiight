# King of the Hill Tournament: Specification vs Current Implementation

## Specification (What It Should Be)

### Structure
- **1 topic** (same topic for all rounds)
- **4 users** (fixed number)
- **Multiple elimination rounds**
- **Judge scores each answer**
- **Lowest-scoring user eliminated each round**
- **Final two debate head-to-head**
- **Winner receives bonus points**

### Tournament Flow

**Round 1 – 4 Participants:**
- All 4 users submit responses to the same topic
- Judge reviews all responses and assigns scores
- **The user with the lowest score is eliminated** (1 person)
- Judge provides brief explanation for why that user was removed

**Round 2 – 3 Participants:**
- Remaining 3 users submit their next responses
- Judge scores all 3
- **Lowest-scoring user is eliminated** (1 person)
- Judge provides reason for elimination

**Round 3 – Final 2 Participants:**
- Top 2 users debate head-to-head for **3 rounds**
- Each round requires both users to submit a new response
- Judge scores each round
- **Total score determines the tournament winner**

**Winner Bonus:**
- Tournament champion receives additional bonus points

---

## Current Implementation (What It Actually Does)

### Structure
- ✅ 1 topic (same topic for all rounds)
- ❌ **Variable number of participants** (not fixed to 4)
- ✅ Multiple elimination rounds
- ✅ Judge scores each answer
- ❌ **Eliminates bottom 25%** (not just 1 person)
- ✅ Final two debate head-to-head
- ✅ Winner receives bonus (via "winner takes all" scoring)

### Tournament Flow

**Round 1 – N Participants:**
- All participants submit responses to the same topic
- AI evaluates all submissions together
- **Bottom 25% are eliminated** (not just 1 person)
- Judge provides elimination explanations

**Round 2 – Remaining Participants:**
- Remaining participants submit next responses
- AI evaluates all submissions
- **Bottom 25% are eliminated** (not just 1 person)
- Judge provides elimination explanations

**Round 3 – Final 2 Participants:**
- ✅ Top 2 users debate head-to-head for **3 rounds**
- ✅ Each round requires both users to submit
- ✅ Judge scores each round
- ✅ Total score determines winner

**Winner Bonus:**
- ✅ "Winner takes all" - champion receives all eliminated participants' cumulative scores

---

## Key Differences

### 1. **Elimination Logic** ❌ WRONG
**Specification:**
- Eliminate **1 person** per round (lowest score)

**Current:**
- Eliminates **bottom 25%** per round (could be 1, 2, or more depending on participant count)

**Example:**
- Round 1 with 4 participants:
  - Spec: Eliminate 1 (lowest)
  - Current: Eliminate 1 (25% of 4 = 1) ✅ Matches by chance
- Round 1 with 8 participants:
  - Spec: Eliminate 1 (lowest)
  - Current: Eliminate 2 (25% of 8 = 2) ❌ Wrong

### 2. **Scoring System** ⚠️ UNCLEAR
**Specification:**
- Each round scored independently
- Lowest scorer eliminated
- Finals: Total score across 3 rounds determines winner

**Current:**
- Uses **cumulative scores** (scores accumulate across rounds)
- Eliminates based on **round score** (not cumulative)
- Finals: Uses debate winner (from 3-round debate)

**Question:** Does spec mean:
- Option A: Each round is independent, lowest round score eliminated?
- Option B: Cumulative scores, but eliminate lowest round score each round?

### 3. **Participant Count** ⚠️ DIFFERENT
**Specification:**
- Fixed at **4 users**

**Current:**
- Variable number of participants (can be any number)

### 4. **Finals Scoring** ✅ CORRECT
**Specification:**
- 3 rounds
- Total score determines winner

**Current:**
- ✅ 3 rounds
- ✅ Total score determines winner (via debate verdict)

### 5. **Bonus Points** ✅ SIMILAR
**Specification:**
- Winner receives bonus points

**Current:**
- ✅ Winner receives all eliminated participants' cumulative scores

---

## Required Changes

### Change 1: Fix Elimination Logic
**Current Code (line 231-233 in king-of-the-hill.ts):**
```typescript
// Calculate how many to eliminate (bottom 25%, minimum 1)
const totalParticipants = participantScores.length
const eliminateCount = Math.max(1, Math.ceil(totalParticipants * 0.25))
```

**Should Be:**
```typescript
// Eliminate only the lowest-scoring participant (1 person)
const eliminateCount = 1
```

### Change 2: Clarify Scoring
**Question:** Should we:
- **Option A**: Use round scores only (each round independent)
- **Option B**: Keep cumulative scores but eliminate based on round score

**Recommendation:** Based on spec saying "judge scores each answer" and "lowest-scoring user eliminated", it seems like **round scores** are what matter for elimination, not cumulative.

### Change 3: Participant Count
**Question:** Should King of the Hill be:
- **Option A**: Fixed at 4 participants only
- **Option B**: Variable (current), but eliminate 1 per round

**Recommendation:** Keep variable, but fix elimination to 1 person per round.

---

## Files That Need Changes

1. **`lib/tournaments/king-of-the-hill.ts`** (line 231-233)
   - Change elimination from 25% to 1 person

2. **`lib/tournaments/king-of-the-hill-ai.ts`** (line 66, 90)
   - Update prompt to say "eliminate lowest-scoring participant" instead of "bottom 25%"

3. **`lib/tournaments/king-of-the-hill.ts`** (line 228-229)
   - Verify sorting is by round score (not cumulative) for elimination

---

## Questions to Clarify

1. **Scoring**: Should elimination be based on:
   - Round score only (each round independent)?
   - Or cumulative score (but eliminate lowest round score)?

2. **Participant Count**: Should it be:
   - Fixed at 4 participants?
   - Or variable (but always eliminate 1 per round)?

3. **Finals**: The spec says "Total score determines winner" - does this mean:
   - Sum of scores from all 3 rounds?
   - Or debate winner (which already uses total score)?

