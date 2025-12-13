# Mobile App - Web App Sync Plan

## Overview
This document outlines the plan to sync the mobile app with all the latest web app features, ensuring feature parity between platforms.

## Current State Analysis

### ✅ Mobile App Has:
- Basic authentication (login/signup)
- Home screen with debates list
- Debates screen (user's debates)
- Leaderboard screen
- Profile screen (basic stats)
- Debate detail screen (basic)
- Navigation system

### ❌ Mobile App Missing:
- **Tournaments** (King of the Hill, Bracket, Championship)
- **Past Debates** on profile
- **Live Battle** panel/notification
- **GROUP debates** support (multiple participants)
- **Tournament bracket** view
- **Advanced debate features** (recent updates)
- **Admin features** (if needed)

## Implementation Plan

### Phase 1: API Services (Foundation)
**Priority: HIGH**

1. **Tournament API Service** (`tournamentsAPI.ts`)
   - `getTournaments()` - List all tournaments
   - `getTournament(id)` - Get tournament details
   - `joinTournament(id)` - Join a tournament
   - `getTournamentBracket(id)` - Get bracket view
   - `getTournamentLeaderboard(id)` - Get tournament leaderboard

2. **Update Profile API** (`profileAPI.ts`)
   - `getPastDebates(userId)` - Get user's completed debates
   - `getUserProfile(username)` - Get profile by username (for viewing others)

3. **Update Debates API** (`debatesAPI.ts`)
   - Support for `challengeType: 'GROUP'`
   - Support for `participants` array
   - Support for `tournamentMatch` data
   - `getActiveDebate(userId)` - Get user's active debate for Live Battle

### Phase 2: Tournament Features
**Priority: HIGH**

1. **Tournaments List Screen** (`TournamentsScreen.tsx`)
   - Display all tournaments (similar to web)
   - Filter by status (REGISTRATION_OPEN, IN_PROGRESS, COMPLETED)
   - Filter by format (BRACKET, CHAMPIONSHIP, KING_OF_THE_HILL)
   - Show tournament cards with:
     - Name, description
     - Format badge (KOH, Bracket, Championship)
     - Status, Privacy, Rounds
     - Participant count
     - Join button (if registration open)

2. **Tournament Detail Screen** (`TournamentDetailScreen.tsx`)
   - Tournament info
   - Participants list
   - Tournament bracket view (for bracket format)
   - Leaderboard (for King of the Hill)
   - Join/Leave button
   - Start button (if creator)

3. **Tournament Bracket Component** (`TournamentBracket.tsx`)
   - Visual bracket display
   - Show matches and winners
   - Highlight current round
   - Show eliminated participants

### Phase 3: Profile Enhancements
**Priority: MEDIUM**

1. **Update Profile Screen** (`ProfileScreen.tsx`)
   - Add "Past Debates" section
   - Show completed debates with:
     - Topic, category
     - Participants (all for GROUP)
     - Result (Won/Lost/Tie)
     - Date
     - Link to debate detail

2. **User Profile Screen** (`UserProfileScreen.tsx`)
   - Add "Past Debates" section (when viewing others)
   - Same as above

### Phase 4: Debate Enhancements
**Priority: HIGH**

1. **Update DebateDetailScreen** (`DebateDetailScreen.tsx`)
   - Support GROUP debates (show all participants)
   - Support tournament debates (show tournament info)
   - Show correct round number (tournament round vs debate round)
   - King of the Hill verdict display
   - Simultaneous submissions for GROUP debates

2. **Update DebateCard Component** (`DebateCard.tsx`)
   - Show all participants for GROUP debates (not just challenger vs opponent)
   - Show tournament round number (not debate's internal 1/1)
   - Show tournament badge
   - Display format correctly

### Phase 5: Live Battle Feature
**Priority: MEDIUM**

1. **Live Battle Component** (`LiveBattlePanel.tsx`)
   - Show user's active debate
   - Display in Home screen or as notification banner
   - Show "Your Turn" badge when applicable
   - Link to debate detail
   - Support tournament debates

2. **Update Home Screen** (`HomeScreen.tsx`)
   - Add Live Battle section at top
   - Show active debate if user has one
   - Prompt user to submit if it's their turn

### Phase 6: Navigation Updates
**Priority: LOW**

1. **Add Tournaments Tab**
   - Add to bottom tab navigation
   - Or add to Home screen as a section

## Implementation Order

### Week 1: Foundation
1. ✅ Create tournament API service
2. ✅ Update profile API for past debates
3. ✅ Update debates API for GROUP/tournament support

### Week 2: Tournament Features
4. ✅ Create TournamentsListScreen
5. ✅ Create TournamentDetailScreen
6. ✅ Create TournamentBracket component

### Week 3: Profile & Debate Updates
7. ✅ Add Past Debates to Profile screens
8. ✅ Update DebateDetailScreen for GROUP/tournaments
9. ✅ Update DebateCard for GROUP/tournaments

### Week 4: Live Battle & Polish
10. ✅ Add Live Battle component
11. ✅ Update Home screen
12. ✅ Testing and bug fixes

## Technical Details

### API Endpoints to Use

**Tournaments:**
- `GET /api/tournaments` - List tournaments
- `GET /api/tournaments/[id]` - Get tournament details
- `POST /api/tournaments/[id]/join` - Join tournament
- `GET /api/tournaments/[id]/bracket` - Get bracket (if exists)

**Profile:**
- `GET /api/users/username/[username]/profile` - Get profile by username
- `GET /api/debates?userId=[id]&status=COMPLETED,VERDICT_READY` - Get past debates

**Debates:**
- `GET /api/debates?userId=[id]&status=ACTIVE` - Get active debate (for Live Battle)
- `GET /api/debates/[id]` - Get debate (includes participants, tournamentMatch)

### Data Structures

**Tournament:**
```typescript
interface Tournament {
  id: string;
  name: string;
  description: string;
  format: 'BRACKET' | 'CHAMPIONSHIP' | 'KING_OF_THE_HILL';
  status: 'REGISTRATION_OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  maxParticipants: number;
  currentRound: number;
  totalRounds: number;
  isPrivate: boolean;
  creator: { id: string; username: string; avatarUrl: string | null };
  participants: Array<{ userId: string; status: string }>;
  _count: { participants: number };
}
```

**Debate (Updated):**
```typescript
interface Debate {
  // ... existing fields
  challengeType?: 'OPEN' | 'DIRECT' | 'GROUP';
  participants?: Array<{
    id: string;
    userId: string;
    status: string;
    user: { id: string; username: string; avatarUrl: string | null };
  }>;
  tournamentMatch?: {
    id: string;
    round: { roundNumber: number };
    tournament: {
      id: string;
      name: string;
      format: string;
      totalRounds: number;
    };
  };
}
```

## Testing Checklist

- [ ] Tournaments list displays correctly
- [ ] Can join tournaments
- [ ] Tournament detail shows all info
- [ ] Tournament bracket displays correctly
- [ ] Past debates show on profile
- [ ] GROUP debates show all participants
- [ ] Tournament debates show correct round number
- [ ] Live Battle shows active debate
- [ ] Can submit in GROUP debates simultaneously
- [ ] King of the Hill verdicts display correctly

## Notes

- All API calls should use the existing `api.ts` base client
- Follow existing mobile app patterns and styling
- Use React Navigation for screen navigation
- Maintain dark theme consistency
- Add loading states and error handling
- Test on both iOS and Android
