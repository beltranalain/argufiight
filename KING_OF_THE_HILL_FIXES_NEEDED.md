# King of the Hill Tournament: Fixes Needed

## Summary

The current implementation is **mostly correct** but has one critical difference:

### ❌ **MAIN ISSUE: Elimination Logic**

**Specification:** Eliminate **1 person** per round (lowest score)

**Current Implementation:** Eliminates **bottom 25%** per round

**Impact:**
- With 4 participants: Eliminates 1 (happens to match) ✅
- With 8 participants: Eliminates 2 (should be 1) ❌
- With 10 participants: Eliminates 3 (should be 1) ❌

---

## Current Implementation Analysis

### ✅ **What's Correct:**

1. **Single Topic:** ✅ Same topic for all rounds
2. **All Participants Submit:** ✅ All active participants submit in each round
3. **AI Judges All Together:** ✅ AI evaluates all submissions together
4. **Finals Structure:** ✅ Final 2 debate head-to-head for 3 rounds
5. **Winner Bonus:** ✅ Winner receives bonus (via "winner takes all")
6. **Elimination Explanations:** ✅ Judge provides explanations

### ❌ **What's Wrong:**

1. **Elimination Count:** Eliminates 25% instead of 1 person
2. **Scoring Logic:** Uses cumulative scores (spec doesn't mention this, but it's not necessarily wrong)

### ⚠️ **Unclear from Spec:**

1. **Participant Count:** Spec says "4 users" - is this fixed or can it vary?
2. **Cumulative Scores:** Spec doesn't mention cumulative scores - should we track them?

---

## Required Changes

### Change 1: Fix Elimination to 1 Person Per Round

**File:** `lib/tournaments/king-of-the-hill.ts`  
**Line:** 231-233

**Current:**
```typescript
// Calculate how many to eliminate (bottom 25%, minimum 1)
const totalParticipants = participantScores.length
const eliminateCount = Math.max(1, Math.ceil(totalParticipants * 0.25))
```

**Should Be:**
```typescript
// Eliminate only the lowest-scoring participant (1 person per round)
const eliminateCount = 1
```

### Change 2: Update AI Prompt

**File:** `lib/tournaments/king-of-the-hill-ai.ts`  
**Lines:** 66, 90

**Current:**
- "Identify the bottom 25% who should be eliminated"
- "Eliminate the bottom 25% (approximately X participants)"

**Should Be:**
- "Identify the lowest-scoring participant who should be eliminated"
- "Eliminate only 1 participant (the one with the lowest score)"

### Change 3: Update Comments

**File:** `lib/tournaments/king-of-the-hill.ts`  
**Line:** 4

**Current:**
```typescript
/**
 * King of the Hill Tournament Logic
 * Free-for-all format where all participants debate the same topic simultaneously
 * Bottom 25% are eliminated each round until finals (2 participants)
 * Finals is a traditional 3-round head-to-head debate
 */
```

**Should Be:**
```typescript
/**
 * King of the Hill Tournament Logic
 * Free-for-all format where all participants debate the same topic simultaneously
 * Lowest-scoring participant is eliminated each round until finals (2 participants)
 * Finals is a traditional 3-round head-to-head debate
 */
```

---

## Scoring Logic Question

The spec says:
- "Judge scores each answer"
- "Lowest-scoring user is eliminated each round"
- "Total score determines the tournament winner" (for finals)

**Current Implementation:**
- Tracks both `roundScore` (for this round) and `cumulativeScore` (across all rounds)
- Eliminates based on `roundScore` (correct)
- Uses cumulative scores for "winner takes all" bonus

**Question:** Should we:
1. **Keep cumulative scores** (current) - tracks performance across rounds
2. **Remove cumulative scores** - each round is independent

**Recommendation:** Keep cumulative scores for the "winner takes all" bonus system, but ensure elimination is based on round score only (which it already is).

---

## Files to Modify

1. ✅ `lib/tournaments/king-of-the-hill.ts` - Fix elimination count
2. ✅ `lib/tournaments/king-of-the-hill-ai.ts` - Update AI prompt
3. ✅ Update comments/documentation

---

## Testing After Fix

After making changes, verify:
1. ✅ Round 1 with 4 participants → Eliminates 1 (lowest score)
2. ✅ Round 2 with 3 participants → Eliminates 1 (lowest score)
3. ✅ Round 3 with 2 participants → 3-round head-to-head debate
4. ✅ Winner receives bonus points
5. ✅ Judge provides elimination explanations

