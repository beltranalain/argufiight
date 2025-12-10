# King of the Hill: Open Debate Style Fix

## Problem Summary

The King of the Hill tournament is creating **head-to-head matches** instead of an **open debate** where all participants can submit simultaneously.

### Current Behavior (WRONG):
- Shows "kubancane vs kamioi" (head-to-head)
- Only displays 2 participants in the debate view
- Tournament bracket shows individual matches instead of one open debate

### Expected Behavior (CORRECT):
- All 4 participants in ONE open debate
- All participants can see each other's submissions
- All participants submit simultaneously
- AI judges all submissions together after everyone submits

---

## Root Causes

### Issue 1: TournamentMatch Only Stores 2 Participants
**File:** `lib/tournaments/king-of-the-hill.ts` (lines 121-130)

**Current:**
```typescript
await prisma.tournamentMatch.create({
  data: {
    tournamentId,
    roundId: round.id,
    participant1Id: activeParticipants[0].id,  // Only first participant
    participant2Id: activeParticipants[activeParticipants.length > 1 ? 1 : 0].id,  // Only second participant
    debateId: debate.id,
    status: 'IN_PROGRESS',
  },
})
```

**Problem:** TournamentMatch schema only has `participant1Id` and `participant2Id`, so it can't represent all participants in one match.

**Impact:** The bracket UI reads from TournamentMatch and shows it as a 1v1 match.

### Issue 2: Debate Page Only Shows Challenger/Opponent
**File:** `app/(dashboard)/debate/[id]/page.tsx` (lines 554-596)

**Current:**
- Only displays `debate.challenger` and `debate.opponent`
- Doesn't display `debate.participants` array even though it exists for GROUP debates

**Problem:** The UI doesn't check for `challengeType === 'GROUP'` to display all participants.

**Impact:** Users only see 2 participants even though all 4 are in the debate.

### Issue 3: Debate Description Shows "vs" Format
**File:** `lib/tournaments/king-of-the-hill.ts` (line 93)

**Current:**
```typescript
description: tournament.description || `King of the Hill Round ${roundNumber}`,
```

**But:** The debate might be getting a description from elsewhere that says "Tournament match: kubancane vs kamioi"

**Problem:** Need to verify where the "vs" description is coming from.

### Issue 4: Turn Logic Still Uses Challenger/Opponent Pattern
**File:** `app/(dashboard)/debate/[id]/page.tsx` (lines 417-425)

**Current:**
```typescript
const isMyTurn = debate && user && debate.status === 'ACTIVE' && (
  // New round (no statements yet): challenger goes first
  (noStatementsInRound && isChallenger) ||
  // Challenger's turn: opponent submitted but challenger hasn't
  (isChallenger && opponentSubmitted && !challengerSubmitted) ||
  // Opponent's turn: challenger submitted but opponent hasn't
  (isOpponent && challengerSubmitted && !opponentSubmitted)
)
```

**Problem:** For GROUP debates, ALL participants should be able to submit simultaneously, not in turns.

**Impact:** Only challenger and opponent can submit, other participants can't.

---

## Required Fixes

### Fix 1: Update TournamentMatch Creation
**File:** `lib/tournaments/king-of-the-hill.ts`

**Option A:** Create a special match record that represents all participants
- Store all participant IDs in a JSON field or separate table
- Or use a flag to indicate it's a multi-participant match

**Option B:** Don't create TournamentMatch for King of the Hill
- The debate itself has all participants
- The bracket UI should read from the debate participants instead

**Recommendation:** Option B - Don't create TournamentMatch for King of the Hill. The bracket should show all participants in one "match" for King of the Hill format.

### Fix 2: Display All Participants in Debate Page
**File:** `app/(dashboard)/debate/[id]/page.tsx` (lines 554-596)

**Change:**
```typescript
{/* Participants */}
{isGroupChallenge && debate.participants ? (
  // Show all participants for GROUP debates
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    {debate.participants.map((participant) => (
      <div key={participant.id} className="flex items-center gap-4">
        <Avatar 
          src={participant.user.avatarUrl}
          username={participant.user.username}
          size="lg"
        />
        <div>
          <p className="font-semibold text-text-primary">{participant.user.username}</p>
          <p className="text-sm text-text-secondary">ELO: {participant.user.eloRating}</p>
          <Badge variant="default" size="sm" className="mt-1">
            {participant.position}
          </Badge>
        </div>
      </div>
    ))}
  </div>
) : (
  // Show challenger/opponent for regular debates
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    {/* Existing challenger/opponent display */}
  </div>
)}
```

### Fix 3: Fix Turn Logic for GROUP Debates
**File:** `app/(dashboard)/debate/[id]/page.tsx` (lines 417-425)

**Change:**
```typescript
const isMyTurn = debate && user && debate.status === 'ACTIVE' && (
  isGroupChallenge
    ? // For GROUP debates: anyone can submit if they haven't submitted yet
      isParticipant && !userSubmitted
    : // For regular debates: challenger/opponent turn-based
      (
        (noStatementsInRound && isChallenger) ||
        (isChallenger && opponentSubmitted && !challengerSubmitted) ||
        (isOpponent && challengerSubmitted && !opponentSubmitted)
      )
)
```

### Fix 4: Update Debate Description
**File:** `lib/tournaments/king-of-the-hill.ts` (line 93)

**Change:**
```typescript
description: `King of the Hill Round ${roundNumber} - All ${activeParticipants.length} participants`,
```

### Fix 5: Update Tournament Bracket Display
**File:** `components/tournaments/TournamentBracket.tsx`

**Change:** For King of the Hill format, show all participants in one "match" instead of separate matches.

**Or:** Don't show bracket for King of the Hill - show a different visualization (list of participants with their status).

---

## Files to Modify

1. ✅ `lib/tournaments/king-of-the-hill.ts` - Fix TournamentMatch creation and description
2. ✅ `app/(dashboard)/debate/[id]/page.tsx` - Display all participants and fix turn logic
3. ✅ `components/tournaments/TournamentBracket.tsx` - Handle King of the Hill display differently
4. ✅ `app/(dashboard)/tournaments/[id]/page.tsx` - Update bracket display logic

---

## Testing Checklist

After fixes:
1. ✅ Create King of the Hill tournament with 4 participants
2. ✅ Verify all 4 participants appear in the debate view
3. ✅ Verify all 4 participants can submit simultaneously
4. ✅ Verify all participants can see each other's submissions
5. ✅ Verify tournament bracket shows all participants in one match (or different visualization)
6. ✅ Verify AI judges all submissions together after everyone submits
7. ✅ Verify lowest-scoring participant is eliminated

