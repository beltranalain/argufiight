# Original Design Finding

## Documentation Source
**File:** `Notes/06-AI-INTEGRATION.md`  
**Line:** 282

## Original Design Specification

The original design document **explicitly states**:

```typescript
// Determine overall winner (majority vote)
const challengerVotes = verdicts.filter((v) => v.decision === 'CHALLENGER_WINS').length
const opponentVotes = verdicts.filter((v) => v.decision === 'OPPONENT_WINS').length
const tieVotes = verdicts.filter((v) => v.decision === 'TIE').length

let finalWinnerId: string | null = null
if (challengerVotes > opponentVotes && challengerVotes > tieVotes) {
  finalWinnerId = debate.challengerId
} else if (opponentVotes > challengerVotes && opponentVotes > tieVotes) {
  finalWinnerId = debate.opponentId
}
```

## Conclusion

**The original design was MAJORITY VOTE**, not total score.

## The Problem

However, this creates a logical inconsistency:
- The UI shows **both** votes and total scores
- Total scores are prominently displayed
- Users expect the person with the higher total score to win
- But the system uses majority vote, which can conflict

## Example of the Conflict

- **User1admin**: 232/300 total score, won 1 judge vote
- **kubancane**: 138/300 total score, won 2 judge votes
- **Majority vote (original)**: kubancane wins ✓ (matches original design)
- **Total score (my fix)**: User1admin should win ✓ (more intuitive)

## Decision Needed

1. **Keep original design (majority vote)**: 
   - Matches original specification
   - Like a jury system
   - But can seem unfair when scores are very different

2. **Change to total score (my fix)**:
   - More fair and intuitive
   - Matches user expectations
   - But deviates from original design

3. **Hybrid approach**:
   - Use total score as primary
   - Use majority vote as tiebreaker
   - Or vice versa

## Recommendation

Given that:
- The UI prominently displays total scores
- Users naturally expect higher scores to win
- The example shows a significant score difference (232 vs 138)

**I recommend using TOTAL SCORE** as the primary method, even though it deviates from the original design document. The original design may have been a mistake or oversight.

However, this is a **design decision** that should be made by the product owner, not just a technical fix.

