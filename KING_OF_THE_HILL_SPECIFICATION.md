# King of the Hill Tournament - Complete Specification

## Overview
King of the Hill is an open debate tournament format where all participants submit arguments simultaneously, and the bottom 25% are eliminated each round until only 2 remain for the finals.

## Tournament Structure

### Round 1 (Initial Round)
- **Participants**: All registered participants (e.g., 4 users)
- **Format**: Open debate - ALL participants submit arguments simultaneously
- **No turns**: Everyone can submit at the same time
- **Debate Type**: `GROUP` challenge
- **Rounds**: 1 round (single submission per participant)
- **Status**: `ACTIVE` when created

### Round 2+ (Elimination Rounds)
- **Participants**: Only ACTIVE participants (survivors from previous rounds)
- **Format**: Same as Round 1 - open debate, all participants submit simultaneously
- **No turns**: Everyone can submit at the same time
- **Debate Type**: `GROUP` challenge
- **Rounds**: 1 round (single submission per participant)
- **Status**: `ACTIVE` when created

### Finals (Last 2 Participants)
- **Participants**: Exactly 2 remaining participants
- **Format**: Traditional 3-round head-to-head debate
- **Turns**: Alternating turns (Round 1: Participant 1, Round 2: Participant 2, Round 3: Participant 1)
- **Debate Type**: `ONE_ON_ONE` challenge
- **Rounds**: 3 rounds
- **Status**: `ACTIVE` when created

## Scoring System (EXACT SAME AS REGULAR DEBATES)

### Judge Selection
- **Number of Judges**: EXACTLY 3 random judges (NOT all 7)
- **Selection Method**: Random selection from all available judges
- **Same as Regular Debates**: Uses the exact same judge selection logic

### Scoring Process
1. **Each Judge Scores Each Participant**: 0-100 points per participant
2. **Total Score Calculation**: Sum of all 3 judges' scores
   - Example: Judge 1 gives 85, Judge 2 gives 72, Judge 3 gives 80
   - Total = 85 + 72 + 80 = 237/300
3. **Display Format**: `xxx/300` (NOT xxx/700 or any other number)
4. **Same as Regular Debates**: Uses the exact same scoring system

### Verdict Display
- **Format**: EXACT same format as regular debates
- **Total Scores Section**: Shows all participants with their xxx/300 scores
- **Individual Judge Verdicts**: Shows each of the 3 judges with their scores (xxx/100) and reasoning
- **Elimination Reasons**: Shows why bottom 25% were eliminated (from all 3 judges)

## Elimination Logic

### Bottom 25% Rule
- **Calculation**: `Math.max(1, Math.ceil(participants.length * 0.25))`
- **Examples**:
  - 4 participants → Eliminate 1 (25% = 1)
  - 3 participants → Eliminate 1 (25% = 0.75, rounded up = 1)
  - 8 participants → Eliminate 2 (25% = 2)
- **Minimum**: Always eliminate at least 1 participant

### Elimination Process
1. All participants submit arguments
2. 3 judges score each participant (0-100 each)
3. Total scores calculated (sum of 3 judges = 0-300)
4. Participants ranked by total score (highest first)
5. Bottom 25% marked as `ELIMINATED`
6. Remaining participants marked as `ACTIVE`
7. Next round automatically starts (if more than 2 remain)

## Round Advancement

### Automatic Advancement
- **Trigger**: When all participants have submitted and verdicts are generated
- **Process**:
  1. Generate verdicts (3 judges score all participants)
  2. Calculate total scores
  3. Eliminate bottom 25%
  4. Mark remaining as ACTIVE
  5. Check participant count:
     - **If 2 participants**: Create finals (3-round head-to-head)
     - **If > 2 participants**: Create next King of the Hill round (open debate)
     - **If < 2 participants**: Complete tournament

### Round Creation
- **Round 1**: Created when tournament starts
- **Round 2+**: Created automatically after previous round completes
- **Finals**: Created automatically when exactly 2 participants remain

## Database Structure

### Debate Creation (Rounds 1-2+)
```typescript
{
  topic: tournament.name,
  category: 'OTHER',
  challengerId: participants[0].userId,
  challengerPosition: 'FOR',
  opponentId: participants[1].userId,
  opponentPosition: 'AGAINST',
  challengeType: 'GROUP', // KEY: Must be GROUP
  status: 'ACTIVE',
  currentRound: 1,
  totalRounds: 1, // Single submission round
  visibility: tournament.isPrivate ? 'PRIVATE' : 'PUBLIC',
}
```

### DebateParticipant Records
- **All participants** must be added to `DebateParticipant` table
- **Status**: `ACTIVE`
- **Position**: Alternating `FOR` and `AGAINST`
- **Critical**: Without these records, participants cannot submit arguments

### Verdict Records
- **3 Verdict records** (one per judge)
- **Format**: Same as regular debates
- **Reasoning**: Contains scores and reasoning for all participants
- **challengerScore/opponentScore**: `null` (not applicable for King of the Hill)

## Submission Flow

### For Participants
1. Navigate to debate page
2. See all participants listed (not just challenger/opponent)
3. Submit argument (no turn restrictions - can submit anytime)
4. Wait for all participants to submit
5. Verdicts automatically generated
6. Results displayed with elimination

### Validation
- **Check**: User must be in `DebateParticipant` table with `status: 'ACTIVE'` or `'ACCEPTED'`
- **Check**: User hasn't already submitted for this round
- **Check**: Debate is `ACTIVE` status
- **Check**: Debate is `GROUP` challenge type

## Tournament Bracket Display

### Round 1-2+ (Non-Finals)
- **Display**: Single "Open Debate" card showing ALL participants
- **Eliminated Participants**: Shown in RED with "✗ Eliminated" badge
- **Active Participants**: Shown normally
- **Format**: Grid layout showing all participants

### Finals
- **Display**: Traditional 1v1 match card
- **Format**: Same as regular bracket tournaments

## Key Requirements

### Must Match Regular Debates
1. ✅ **3 random judges** (not all 7)
2. ✅ **Scoring system**: 0-100 per judge, 0-300 total
3. ✅ **Verdict display format**: Exact same as regular debates
4. ✅ **Reasoning format**: Same structure and style

### Must Be Open Debate Format
1. ✅ **All participants submit simultaneously** (no turns)
2. ✅ **GROUP challenge type** (not ONE_ON_ONE)
3. ✅ **All participants visible** on debate page
4. ✅ **No turn restrictions** for submission

### Must Automatically Advance
1. ✅ **Round 2+ created automatically** after verdicts
2. ✅ **Finals created automatically** when 2 participants remain
3. ✅ **Participants notified** when new round starts

## Common Issues and Fixes

### Issue: "You are not a participant in this debate"
- **Cause**: Participant not in `DebateParticipant` table
- **Fix**: Ensure all participants are added when debate is created

### Issue: "All scores are the same"
- **Cause**: AI not differentiating participants
- **Fix**: Check AI prompt and ensure it scores each participant independently

### Issue: "Scores showing xxx/700 instead of xxx/300"
- **Cause**: Using all 7 judges instead of 3
- **Fix**: Limit to exactly 3 judges and set maxPossibleScore to 300

### Issue: "Round 2 not starting automatically"
- **Cause**: Round advancement logic not triggered
- **Fix**: Ensure `checkAndAdvanceTournamentRound` is called after verdicts

### Issue: "Can't submit arguments in Round 2"
- **Cause**: Participants not added to `DebateParticipant` table
- **Fix**: Ensure `createKingOfTheHillRound` adds all participants to debate

