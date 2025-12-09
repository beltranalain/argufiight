# Phase 2: Features and Fixes - Analysis & Recommendations

## Status: Firebase Push Notifications - ON HOLD
Firebase implementation is complete but on hold due to Server Key configuration issues. Will resume after Phase 2.

---

## 1. Multi-User Account Switching

### Current State
- Users can only be logged into one account at a time
- No account switching functionality

### Recommendation: **Implement Account Switcher**

**Approach:**
1. **Store Multiple Sessions**: Allow users to have multiple active sessions (already supported by `Session` model)
2. **Account Switcher UI**: Add a dropdown in TopNav showing all logged-in accounts
3. **Quick Switch**: Click to switch between accounts without logging out
4. **Session Management**: Store active sessions in localStorage/cookies

**Implementation:**
- Add `AccountSwitcher` component in `TopNav.tsx`
- Create `/api/auth/switch-account` endpoint
- Store active account ID in session/cookie
- Update `useAuth` hook to support multiple accounts
- Add "Switch Account" option in user menu

**Database Changes:**
- No schema changes needed (Session model already supports multiple sessions per user)
- May need to add `activeAccountId` to session or cookie

**Complexity:** Medium
**Priority:** Medium (nice-to-have, not critical)

---

## 2. Google Login at Login Page

### Current State
- Google OAuth exists for advertisers/employees only
- Regular users cannot use Google login
- Login page only has email/password

### Recommendation: **Add Google OAuth for All Users**

**Approach:**
1. **Extend Google OAuth**: Make it available to all users, not just advertisers
2. **Add Google Button**: Add "Sign in with Google" button on login page
3. **Account Linking**: If email exists, link Google account; if not, create new account
4. **Profile Completion**: If new user, prompt for username after Google auth

**Implementation:**
- Update `app/auth/signin/page.tsx` to include Google OAuth button
- Modify `app/api/auth/google/callback/route.ts` to handle regular users
- Update `User` model logic to allow Google auth for all users
- Add username prompt flow for new Google users

**Database Changes:**
- No schema changes needed (`googleId`, `googleEmail`, `googlePicture` already exist)
- May need to add `googleAuthEnabled` check for all users

**Complexity:** Low-Medium
**Priority:** High (improves user experience, reduces friction)

---

## 3. Group Challenge Bug Fix

### Current State
- Group challenge only challenges the first person
- Should challenge all selected users (up to 10)
- Should create a multi-participant debate (5+ people)

### Recommendation: **Fix Group Challenge Logic**

**Problem Identified:**
Looking at `app/api/debates/route.ts`:
- Group challenge creates a debate with `challengerId` and `opponentId` (only 2 participants)
- `invitedUserIds` is stored but debate structure only supports 2 participants
- When accepting, only one person can accept (sets `opponentId`)

**Solution:**
1. **Create Multi-Participant Debate Model**: 
   - Add `DebateParticipant` model (many-to-many relationship)
   - Store all participants, not just challenger/opponent
   - Track each participant's position, status, and submissions

2. **Update Group Challenge Flow**:
   - Create debate with `challengeType: 'GROUP'`
   - Create `DebateParticipant` records for all invited users
   - All participants can accept/decline independently
   - Debate starts when all (or minimum threshold) accept

3. **Update Debate Logic**:
   - Round progression: Wait for all participants to submit
   - AI Judging: Judge all participants, determine winner
   - Display: Show all participants in debate view

**Database Changes:**
```prisma
model DebateParticipant {
  id        String   @id @default(uuid())
  debateId  String
  debate    Debate   @relation(fields: [debateId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  position  DebatePosition
  status    String   // INVITED, ACCEPTED, DECLINED, ACTIVE, ELIMINATED
  joinedAt  DateTime?
  createdAt DateTime @default(now())
  
  @@unique([debateId, userId])
  @@index([debateId])
  @@index([userId])
}
```

**Complexity:** High
**Priority:** High (core feature not working correctly)

---

## 4. King of the Hill Tournament Format

### Current State
- Only `BRACKET` and `CHAMPIONSHIP` formats exist
- No free-for-all elimination format

### Recommendation: **Add KING_OF_THE_HILL Format**

**How It Works:**
1. **Registration**: Up to N participants (e.g., 10, 16, 32)
2. **Round 1**: All participants debate simultaneously (free-for-all)
3. **Elimination**: After Round 1, eliminate bottom 25% (or X%)
4. **Subsequent Rounds**: Continue eliminating bottom 25% each round
5. **Finals**: Last 2-4 participants compete for championship

**Math for Elimination:**
```
Round 1: 10 participants → Eliminate bottom 25% → 7.5 → Round up to 8 (or down to 7)
Round 2: 8 participants → Eliminate bottom 25% → 6 remaining
Round 3: 6 participants → Eliminate bottom 25% → 4.5 → 4 remaining
Round 4: 4 participants → Eliminate bottom 25% → 3 remaining
Round 5: 3 participants → Eliminate bottom 25% → 2.25 → 2 remaining (Finals)
Round 6: 2 participants → Winner determined
```

**Better Approach - Fixed Elimination:**
```
Round 1: 10 participants → Eliminate 2 (bottom 20%) → 8 remaining
Round 2: 8 participants → Eliminate 2 (bottom 25%) → 6 remaining
Round 3: 6 participants → Eliminate 1 (bottom ~17%) → 5 remaining
Round 4: 5 participants → Eliminate 1 (bottom 20%) → 4 remaining
Round 5: 4 participants → Eliminate 1 (bottom 25%) → 3 remaining
Round 6: 3 participants → Eliminate 1 (bottom ~33%) → 2 remaining (Finals)
Round 7: 2 participants → Winner determined
```

**Or Simpler - Percentage-Based:**
```
Elimination Rate: 25% per round (round down)
Round 1: 10 → Eliminate floor(10 * 0.25) = 2 → 8 remaining
Round 2: 8 → Eliminate floor(8 * 0.25) = 2 → 6 remaining
Round 3: 6 → Eliminate floor(6 * 0.25) = 1 → 5 remaining
Round 4: 5 → Eliminate floor(5 * 0.25) = 1 → 4 remaining
Round 5: 4 → Eliminate floor(4 * 0.25) = 1 → 3 remaining
Round 6: 3 → Eliminate floor(3 * 0.25) = 0 → Keep 3, or force eliminate 1 → 2 (Finals)
Round 7: 2 → Winner
```

**Implementation:**
1. Add `KING_OF_THE_HILL` to `TournamentFormat` enum
2. Create `lib/tournaments/king-of-the-hill.ts`:
   - `generateFreeForAllMatches()` - All participants debate in same round
   - `calculateScores()` - Score all participants
   - `eliminateBottomPercent()` - Eliminate bottom X%
   - `advanceRound()` - Move to next round with remaining participants

3. Update match generation:
   - Round 1: Create debates for all participants (pair randomly or use round-robin)
   - Scoring: Each participant gets average score from their debates
   - Elimination: Sort by score, eliminate bottom 25%
   - Next Round: Repeat with remaining participants

**Database Changes:**
- Add `KING_OF_THE_HILL` to `TournamentFormat` enum
- No other schema changes needed (existing tournament structure works)

**Complexity:** High
**Priority:** Medium (new feature, not a bug)

---

## 5. Recent Debates Showing "Completed" When Ongoing

### Current State
- Recent Debates section shows debates as "Completed" when they're actually ongoing
- Status display logic is incorrect

### Recommendation: **Fix Status Display Logic**

**Problem Identified:**
Looking at `components/panels/ProfilePanel.tsx`:
- Fetches debates with `status !== 'WAITING'`
- Displays status directly from `debate.status`
- May be showing `COMPLETED` when it should show `ACTIVE`

**Possible Issues:**
1. **Status Not Updated**: Debate status not updating when rounds advance
2. **Status Check Logic**: Frontend checking wrong status field
3. **API Response**: API returning wrong status

**Solution:**
1. **Check Status Logic**: Verify debate status is correctly updated in:
   - `app/api/debates/[id]/statements/route.ts` (when round advances)
   - `app/api/debates/process-expired/route.ts` (when debate times out)
   - `lib/tournaments/round-advancement.ts` (tournament debates)

2. **Fix Display Logic**:
   ```typescript
   const getStatusDisplay = (debate: Debate) => {
     if (debate.status === 'ACTIVE') return 'Ongoing'
     if (debate.status === 'COMPLETED') return 'Awaiting Verdict'
     if (debate.status === 'VERDICT_READY') return 'Verdict Ready'
     if (debate.status === 'APPEALED') return 'Appealed'
     return debate.status
   }
   ```

3. **Add Status Badge Colors**:
   - `ACTIVE` → Green "Ongoing"
   - `COMPLETED` → Yellow "Awaiting Verdict"
   - `VERDICT_READY` → Blue "Verdict Ready"

**Complexity:** Low
**Priority:** High (user confusion, display bug)

---

## Implementation Priority

### High Priority (Fix First)
1. **Group Challenge Bug** - Core feature broken
2. **Recent Debates Status** - User confusion
3. **Google Login** - User experience improvement

### Medium Priority
4. **King of the Hill Tournament** - New feature
5. **Multi-User Switching** - Nice-to-have

---

## Estimated Effort

| Feature | Complexity | Estimated Time |
|---------|-----------|----------------|
| Google Login | Low-Medium | 4-6 hours |
| Group Challenge Fix | High | 12-16 hours |
| Recent Debates Status | Low | 2-3 hours |
| King of the Hill | High | 16-20 hours |
| Multi-User Switching | Medium | 6-8 hours |
| **Total** | | **40-53 hours** |

---

## Recommendations

1. **Start with Quick Wins**: Fix Recent Debates status (2-3 hours)
2. **Then Critical Bug**: Fix Group Challenge (12-16 hours)
3. **Add Google Login**: Improve UX (4-6 hours)
4. **New Features**: King of the Hill and Multi-User (later)

Would you like me to start implementing these in priority order?

