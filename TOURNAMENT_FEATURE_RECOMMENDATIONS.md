# Tournament Feature Recommendations

## Overview
Tournament feature allowing users to create structured debate competitions with reseeding, unlimited rounds, and subscription-based access.

---

## 🎯 Core Concept

### Tournament Structure
- **Creator**: User who pays $1/month subscription for unlimited tournaments
- **Participants**: Any registered users (free or paid)
- **Format**: Bracket-style elimination with reseeding after each round
- **Rankings**: ELO still applies to individual debates within tournaments

---

## 💰 Pricing Model

### Subscription Tiers

**Tournament Creator Subscription: $1/month**
- ✅ Unlimited tournament creation
- ✅ Unlimited rounds per tournament
- ✅ Custom tournament settings (bracket size, judge selection, time limits)
- ✅ Tournament analytics and leaderboards
- ✅ Ability to set entry requirements (ELO minimum, etc.)

**Free Users**
- ✅ Can participate in tournaments
- ❌ Cannot create tournaments
- ✅ Still earn ELO from tournament debates

### Payment Integration
- **Stripe** recommended (industry standard, easy integration)
- Monthly recurring subscription
- Cancel anytime, access until period ends

---

## 🏗️ Database Schema

### New Models

```prisma
model Tournament {
  id            String   @id @default(cuid())
  name          String
  description   String?
  creatorId     String
  creator       User     @relation("TournamentCreator", fields: [creatorId], references: [id])
  
  // Settings
  maxParticipants Int     @default(16) // 8, 16, 32, 64
  currentRound    Int     @default(1)
  totalRounds     Int     // Calculated from maxParticipants
  status          TournamentStatus @default(UPCOMING)
  
  // Requirements
  minElo          Int?    // Optional ELO requirement
  judgeId         String? // Optional specific judge
  judge           Judge?  @relation(fields: [judgeId], references: [id])
  
  // Timing
  startDate       DateTime
  endDate         DateTime?
  roundDuration   Int     // Hours per round
  
  // Reseeding
  reseedAfterRound Boolean @default(true)
  reseedMethod     ReseedMethod @default(ELO_BASED)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  participants   TournamentParticipant[]
  matches        TournamentMatch[]
  rounds         TournamentRound[]
  
  @@index([creatorId])
  @@index([status])
}

enum TournamentStatus {
  UPCOMING
  REGISTRATION_OPEN
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum ReseedMethod {
  ELO_BASED      // Reseed by current ELO
  TOURNAMENT_WINS // Reseed by tournament wins
  RANDOM         // Random reseeding
}

model TournamentParticipant {
  id            String   @id @default(cuid())
  tournamentId  String
  tournament    Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  userId        String
  user          User     @relation("TournamentParticipant", fields: [userId], references: [id])
  
  // Tournament-specific stats
  seed          Int?     // Initial seed (1 = highest ELO)
  currentSeed   Int?     // Current seed after reseeding
  wins          Int      @default(0)
  losses        Int      @default(0)
  eloAtStart    Int      // Snapshot of ELO when tournament started
  
  // Status
  status        ParticipantStatus @default(REGISTERED)
  eliminatedAt  DateTime?
  
  registeredAt  DateTime @default(now())
  
  matches       TournamentMatch[] @relation("Participant1")
                TournamentMatch[] @relation("Participant2")
  
  @@unique([tournamentId, userId])
  @@index([tournamentId])
  @@index([userId])
}

enum ParticipantStatus {
  REGISTERED
  ACTIVE
  ELIMINATED
  DISQUALIFIED
}

model TournamentRound {
  id            String   @id @default(cuid())
  tournamentId  String
  tournament    Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  
  roundNumber   Int
  status        RoundStatus @default(UPCOMING)
  startDate     DateTime?
  endDate       DateTime?
  
  matches       TournamentMatch[]
  
  @@unique([tournamentId, roundNumber])
  @@index([tournamentId])
}

enum RoundStatus {
  UPCOMING
  IN_PROGRESS
  COMPLETED
}

model TournamentMatch {
  id            String   @id @default(cuid())
  tournamentId  String
  tournament    Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  roundId       String
  round         TournamentRound @relation(fields: [roundId], references: [id])
  
  participant1Id String
  participant1   TournamentParticipant @relation("Participant1", fields: [participant1Id], references: [id])
  participant2Id String
  participant2   TournamentParticipant @relation("Participant2", fields: [participant2Id], references: [id])
  
  // Link to actual debate
  debateId      String?  @unique
  debate        Debate?  @relation(fields: [debateId], references: [id])
  
  // Match result
  winnerId     String?
  winner       TournamentParticipant? @relation("MatchWinner", fields: [winnerId], references: [id])
  status       MatchStatus @default(SCHEDULED)
  
  scheduledAt  DateTime?
  completedAt  DateTime?
  
  @@index([tournamentId])
  @@index([roundId])
  @@index([debateId])
}

enum MatchStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  FORFEITED
}

model TournamentSubscription {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  
  stripeSubscriptionId String? @unique
  stripeCustomerId    String?
  
  status        SubscriptionStatus @default(ACTIVE)
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  cancelledAt   DateTime?
  
  @@index([userId])
  @@index([status])
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  EXPIRED
  PAST_DUE
}
```

### User Model Updates

```prisma
model User {
  // ... existing fields ...
  
  // Tournament relations
  createdTournaments Tournament[] @relation("TournamentCreator")
  tournamentParticipations TournamentParticipant[] @relation("TournamentParticipant")
  tournamentSubscription TournamentSubscription?
}
```

---

## 🔄 Reseeding Logic

### When Reseeding Occurs
- After each round completion (if `reseedAfterRound = true`)
- Before starting next round

### Reseeding Methods

**1. ELO-Based (Recommended)**
```typescript
// Sort remaining participants by current ELO (highest to lowest)
// Reassign seeds 1-N based on ELO ranking
// Ensures strongest players face each other later
```

**2. Tournament Wins**
```typescript
// Sort by wins in current tournament
// Tie-breaker: ELO
// Rewards tournament performance
```

**3. Random**
```typescript
// Randomize remaining participants
// Adds unpredictability
```

### Implementation Example

```typescript
async function reseedTournament(
  tournamentId: string,
  method: ReseedMethod
): Promise<void> {
  const remaining = await prisma.tournamentParticipant.findMany({
    where: {
      tournamentId,
      status: { in: ['REGISTERED', 'ACTIVE'] }
    },
    include: { user: true }
  })

  let sorted: TournamentParticipant[]

  switch (method) {
    case 'ELO_BASED':
      sorted = remaining.sort((a, b) => 
        b.user.elo - a.user.elo
      )
      break
    case 'TOURNAMENT_WINS':
      sorted = remaining.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins
        return b.user.elo - a.user.elo
      })
      break
    case 'RANDOM':
      sorted = remaining.sort(() => Math.random() - 0.5)
      break
  }

  // Update seeds
  for (let i = 0; i < sorted.length; i++) {
    await prisma.tournamentParticipant.update({
      where: { id: sorted[i].id },
      data: { currentSeed: i + 1 }
    })
  }
}
```

---

## 🎮 Tournament Flow

### 1. Creation
```
User (with subscription) → Create Tournament
  → Set name, description, max participants
  → Set requirements (min ELO, judge)
  → Set start date
  → Tournament created in UPCOMING status
```

### 2. Registration
```
Tournament → Status: REGISTRATION_OPEN
  → Users can register (if they meet requirements)
  → Initial seeding by ELO (highest ELO = seed 1)
  → When max participants reached → Auto-start
```

### 3. Round Generation
```
For each round:
  1. Reseed participants (if enabled)
  2. Generate bracket matches:
     - Round 1: Seed 1 vs Seed 16, Seed 2 vs Seed 15, etc.
     - Round 2: Winners face each other
  3. Create TournamentMatch records
  4. Create Debate records linked to matches
  5. Notify participants
```

### 4. Match Execution
```
Match scheduled → Participants notified
  → Debate created with tournament context
  → Participants submit arguments
  → AI judge evaluates
  → Winner determined
  → TournamentMatch updated
  → Participant stats updated
```

### 5. Round Completion
```
All matches in round complete:
  → Check if tournament complete (1 winner)
  → If not: Reseed and generate next round
  → If yes: Declare champion, update status to COMPLETED
```

---

## 📊 Bracket Visualization

### UI Components Needed

1. **Tournament Bracket View**
   - Visual bracket tree
   - Shows current round
   - Highlights active matches
   - Shows winners advancing

2. **Tournament Dashboard**
   - Overview of all tournaments
   - Filter by status, participation
   - Create tournament button (subscription check)

3. **Tournament Detail Page**
   - Bracket visualization
   - Participant list with seeds
   - Round-by-round results
   - Leaderboard

4. **Match Card**
   - Participants
   - Debate link
   - Status (scheduled/in-progress/completed)
   - Winner highlight

---

## 🔐 Access Control

### Tournament Creation
```typescript
async function canCreateTournament(userId: string): Promise<boolean> {
  const subscription = await prisma.tournamentSubscription.findUnique({
    where: {
      userId,
      status: 'ACTIVE',
      currentPeriodEnd: { gte: new Date() }
    }
  })
  return !!subscription
}
```

### Tournament Participation
- Free users can join
- Must meet requirements (ELO, etc.)
- Cannot create tournaments

---

## 💡 Additional Features to Consider

### 1. Tournament Types
- **Single Elimination**: Standard bracket (recommended for MVP)
- **Double Elimination**: Losers bracket
- **Round Robin**: All vs all (for smaller tournaments)
- **Swiss System**: Pairing based on performance

### 2. Prizes/Rewards
- ELO bonuses for tournament performance
- Badges/achievements
- Special tournament winner badge
- Leaderboard recognition

### 3. Tournament Settings
- **Time Limits**: Per round, per debate
- **Judge Selection**: Random, specific, or participant choice
- **Topic Selection**: Creator sets, or participants vote
- **Private Tournaments**: Invite-only

### 4. Notifications
- Registration open
- Match scheduled
- Your turn to debate
- Round completed
- Tournament completed

### 5. Analytics
- Tournament statistics
- Most active tournaments
- Best tournament performers
- Tournament completion rates

---

## 🚀 Implementation Phases

### Phase 1: MVP (Minimum Viable Product)
1. ✅ Database schema
2. ✅ Subscription model (Stripe integration)
3. ✅ Tournament creation (subscription check)
4. ✅ Registration system
5. ✅ Basic bracket generation
6. ✅ Match creation and debate linking
7. ✅ Simple reseeding (ELO-based)
8. ✅ Tournament status management

### Phase 2: Enhanced Features
1. Bracket visualization
2. Multiple reseeding methods
3. Tournament analytics
4. Notifications
5. Tournament search/filtering

### Phase 3: Advanced Features
1. Multiple tournament types
2. Custom settings
3. Prizes/rewards system
4. Tournament templates
5. Recurring tournaments

---

## 🎯 Key Design Decisions

### 1. ELO Still Matters
- ✅ Individual debates in tournaments affect ELO
- ✅ Tournament performance doesn't directly change ELO
- ✅ But tournament wins are tracked separately
- **Rationale**: Keeps competitive integrity, prevents gaming

### 2. Unlimited Rounds
- ✅ No cap on tournament size
- ✅ System calculates rounds automatically
- ✅ 16 participants = 4 rounds, 32 = 5 rounds, etc.
- **Rationale**: Flexibility for different tournament sizes

### 3. Reseeding After Each Round
- ✅ Default: enabled
- ✅ Optional: can disable for traditional bracket
- **Rationale**: Keeps competition fair, prevents bracket luck

### 4. Subscription Model
- ✅ $1/month is very affordable
- ✅ Unlimited tournaments = high value
- ✅ Can participate for free
- **Rationale**: Low barrier to entry, high engagement

---

## ⚠️ Potential Challenges

### 1. Scheduling Conflicts
- **Problem**: Participants may not be available
- **Solution**: 
  - Flexible time windows per round
  - Auto-forfeit if not completed
  - Allow rescheduling for early rounds

### 2. Dropouts
- **Problem**: Participants may leave mid-tournament
- **Solution**:
  - Auto-forfeit after inactivity
  - Allow substitutes (if early enough)
  - Bracket adjusts automatically

### 3. Scalability
- **Problem**: Many concurrent tournaments
- **Solution**:
  - Efficient database queries
  - Background jobs for round progression
  - Caching tournament states

### 4. Fairness
- **Problem**: Ensuring fair matchups
- **Solution**:
  - Transparent reseeding logic
  - ELO-based initial seeding
  - Clear tournament rules

---

## 📈 Success Metrics

### Engagement
- Tournament creation rate
- Participation rate
- Tournament completion rate
- Average tournaments per creator

### Revenue
- Subscription conversion rate
- Monthly recurring revenue (MRR)
- Churn rate
- Average subscription duration

### Competition
- Average tournament size
- Most popular tournament settings
- Tournament win distribution
- ELO impact from tournaments

---

## 🎨 UI/UX Considerations

### Tournament Creation Flow
1. Check subscription status
2. If not subscribed → Show pricing modal
3. If subscribed → Tournament creation form
4. Preview bracket before confirming
5. Set registration period

### Tournament Dashboard
- Clear visual hierarchy
- Status badges (Upcoming, In Progress, Completed)
- Quick actions (Join, View, Create)
- Filter/search functionality

### Bracket View
- Responsive design (mobile-friendly)
- Interactive (click to see match details)
- Real-time updates
- Clear winner progression

---

## 🔧 Technical Stack Recommendations

### Payment Processing
- **Stripe**: Industry standard, excellent docs
- **Stripe Subscriptions**: Built-in recurring billing
- **Webhooks**: Handle subscription events

### Background Jobs
- **Vercel Cron**: For scheduled tasks (round progression)
- **Queue System**: For match generation, notifications
- **Database Triggers**: For automatic status updates

### Real-time Updates
- **WebSockets** or **Server-Sent Events**: For live bracket updates
- **Polling**: Fallback for simpler implementation

---

## ✅ Final Recommendations

1. **Start Simple**: MVP with single elimination, ELO-based reseeding
2. **Focus on UX**: Make tournament creation and participation seamless
3. **Monetize Early**: Get subscription system working first
4. **Gather Feedback**: Launch with beta users, iterate based on usage
5. **Scale Gradually**: Add features based on demand

### Priority Order
1. Subscription system + Tournament creation
2. Registration + Bracket generation
3. Match linking + Debate integration
4. Reseeding logic
5. Bracket visualization
6. Analytics and notifications

---

## 💬 Questions to Consider

1. **Tournament Size Limits**: Max participants? (Recommend: 64 for MVP)
2. **Entry Fees**: Optional entry fees for prize pools?
3. **Team Tournaments**: Support for team-based debates?
4. **Tournament Moderation**: Admin oversight needed?
5. **Tournament Templates**: Pre-configured tournament types?

---

This tournament feature would be a **major differentiator** for Argu Fight, creating a competitive ecosystem that drives engagement and provides a clear monetization path. The $1/month price point is accessible while still generating meaningful revenue at scale.










