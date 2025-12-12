# Time Expiration Logic for Debates

## Current Situation
- Debates have `roundDeadline` but no automatic processing when time expires
- UI shows "Time expired" but nothing happens automatically
- No penalty system for missing submissions

## Recommended Approach

### Option 1: Automatic Loss for Missing Submission (RECOMMENDED)
**When time expires:**
1. **If one person submitted and the other didn't:**
   - The person who submitted gets a "win" for that round
   - The person who didn't submit gets a "loss" for that round
   - Round advances automatically
   - If it's the final round, debate ends and goes to verdict with the submitted arguments

2. **If both submitted:**
   - Round advances normally (current behavior)

3. **If neither submitted:**
   - Both get a "tie" for that round
   - Round advances
   - If multiple rounds with no submissions, debate could be marked as "ABANDONED"

### Option 2: Grace Period + Auto-Advance
- Give a 1-hour grace period after deadline
- If still no submission, auto-advance with penalty
- More forgiving but still enforces deadlines

### Option 3: Debate Cancellation
- If someone accepts but never submits in first round → cancel debate
- Too harsh, not recommended

## Implementation Plan

1. **Create a cron job** that runs every 5-10 minutes to check expired rounds
2. **Process expired rounds:**
   - Find debates with `roundDeadline < now` and `status = 'ACTIVE'`
   - Check who submitted and who didn't
   - Advance round or end debate accordingly
   - Apply penalties (ELO loss, round loss)

3. **Penalty System:**
   - Missing a submission = automatic loss for that round
   - Could affect final verdict (judges see incomplete rounds)
   - ELO penalty for abandoning debates

## Suggested Rules

### Round Expiration:
- **One person submitted**: They win the round, opponent loses
- **Both submitted**: Normal advancement
- **Neither submitted**: Tie round, both get minor penalty

### First Round Special Case:
- If opponent accepts but doesn't submit in first round within deadline:
  - Could be considered "abandonment"
  - Challenger wins by default
  - Or debate gets cancelled (less recommended)

### Final Round:
- If time expires and one person submitted:
  - Debate ends immediately
  - Verdict is generated with available arguments
  - Missing submission counts heavily against the non-submitter





