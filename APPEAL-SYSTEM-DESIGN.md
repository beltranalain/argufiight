# Appeal System Design

## Overview

A simple, free appeal system that allows losers to contest AI verdicts. One free appeal per debate, with a new verdict generated using different judges.

## User Flow

1. **Debate completes** → Verdict generated → Status: `VERDICT_READY`
2. **Loser views verdict** → Sees "You Lost" message
3. **Loser clicks "Appeal Verdict"** → Appeal submitted
4. **System generates new verdict** → Status: `APPEALED` → `PROCESSING` → `RESOLVED`
5. **New verdict displayed** → Final (no second appeal)

## Database Schema Changes

### Debate Model Additions:
```prisma
// Appeal System
appealedAt     DateTime?    @map("appealed_at")
appealStatus   AppealStatus? @default(null) @map("appeal_status")
appealCount    Int          @default(0) @map("appeal_count")
appealedBy     String?      @map("appealed_by") // User ID who appealed
originalWinnerId String?    @map("original_winner_id") // Store original winner before appeal
```

### New Enum:
```prisma
enum AppealStatus {
  PENDING       // Appeal submitted, awaiting new verdict
  PROCESSING    // New verdict being generated
  RESOLVED      // Appeal resolved with new verdict
  DENIED        // Appeal denied (if we add validation)
}
```

### New DebateStatus:
```prisma
APPEALED      // Verdict appealed, awaiting re-verdict
```

## API Routes

### POST /api/debates/[id]/appeal
- **Auth:** Required
- **Validation:**
  - User must be the loser
  - Debate status must be `VERDICT_READY`
  - `appealCount` must be 0 (one appeal per debate)
  - Must be within 48 hours of verdict
- **Actions:**
  - Update debate: `appealStatus = PENDING`, `appealedAt = now()`, `appealedBy = userId`, `originalWinnerId = winnerId`
  - Set `winnerId = null` (temporarily)
  - Trigger new verdict generation (async)
  - Create notification for opponent

### POST /api/verdicts/regenerate
- **Auth:** Internal (called by appeal route)
- **Actions:**
  - Select 3 different judges (exclude original judges)
  - Generate new verdicts
  - Update debate with new winner
  - Recalculate ELO changes
  - Update user stats
  - Set `appealStatus = RESOLVED`
  - Create notifications

## UI Components

### AppealButton Component
- Shows only for losers
- Only when `status === VERDICT_READY` and `appealCount === 0`
- Displays time remaining (48 hours)
- Confirmation modal before submitting
- Loading state during appeal processing

### Appeal Status Display
- Show appeal status in verdict display
- "Appeal Pending" message
- "Appeal Resolved" with new verdict
- Show original vs. new verdict comparison

## Business Rules

1. **One Appeal Per Debate:** `appealCount` tracks this
2. **48-Hour Window:** Appeals must be submitted within 48 hours of verdict
3. **Different Judges:** New verdict uses judges not used in original
4. **Final Verdict:** Appeal verdict is final (no second appeal)
5. **ELO Updates:** Only if new verdict differs from original
6. **Free:** No monetization, completely free

## Edge Cases

- **What if appeal verdict is same?** → ELO stays the same, just update appeal status
- **What if user appeals after 48 hours?** → Show error, appeal window expired
- **What if debate already appealed?** → Hide appeal button, show "Already Appealed"
- **What if appeal fails?** → Set `appealStatus = DENIED`, allow retry (or not)

## Implementation Order

1. Update database schema (add appeal fields)
2. Create migration
3. Update `DebateStatus` enum
4. Create appeal API route
5. Create regenerate verdict route
6. Build `AppealButton` component
7. Update `VerdictDisplay` to show appeal status
8. Add appeal notifications
9. Test appeal flow end-to-end

## Future Enhancements (Not in Phase 8)

- Appeal analytics (success rate)
- Appeal history in user profile
- Admin appeal review (if needed)
- Appeal cooldown (prevent spam)
- Community voting on appeals (future feature)



