# Belt System Database Schema

## Overview
This document outlines the complete database schema for the belt system, designed to integrate seamlessly with the existing Debate and Tournament models.

---

## Enums

```prisma
enum BeltType {
  ROOKIE          // First belt earned
  CATEGORY        // Category-specific belt (Sports, Politics, etc.)
  CHAMPIONSHIP    // Cross-category, highest tier
  UNDEFEATED      // Streak-based belt
  TOURNAMENT      // Tournament-specific belt
}

enum BeltStatus {
  ACTIVE          // Currently held, can be challenged
  INACTIVE        // Not defended for X days, top competitors can compete
  VACANT          // No holder, anyone can claim
  STAKED          // Currently at risk in a debate/tournament
  GRACE_PERIOD    // First 30 days, protected from loss
  MANDATORY       // Mandatory defense required
}

enum ChallengeStatus {
  PENDING         // Challenge sent, awaiting response
  ACCEPTED        // Challenge accepted, debate created
  DECLINED        // Challenge declined
  EXPIRED         // Challenge expired (time limit)
  CANCELLED       // Challenge cancelled by challenger
  COMPLETED       // Challenge completed, belt transferred
}

enum BeltTransferReason {
  DEBATE_WIN      // Lost belt in a debate
  TOURNAMENT_WIN  // Lost belt in a tournament
  MANDATORY_LOSS  // Lost in mandatory defense
  INACTIVITY      // Lost due to inactivity
  ADMIN_TRANSFER  // Manually transferred by admin
  CHALLENGE_WIN   // Won belt via challenge
  FORFEIT         // Forfeited belt
}
```

---

## Models

### 1. Belt Model
The core belt entity representing a championship belt.

```prisma
model Belt {
  id          String   @id @default(uuid())
  name        String   // e.g., "Sports Championship Belt"
  type        BeltType
  category    String?  // For CATEGORY belts (SPORTS, POLITICS, etc.)
  
  // Current holder
  currentHolderId String?  @map("current_holder_id")
  currentHolder   User?    @relation("BeltHolder", fields: [currentHolderId], references: [id])
  
  // Status tracking
  status          BeltStatus @default(VACANT)
  acquiredAt      DateTime?  @map("acquired_at") // When current holder got it
  lastDefendedAt  DateTime?  @map("last_defended_at")
  nextDefenseDue  DateTime?  @map("next_defense_due") // Mandatory defense date
  inactiveAt      DateTime?  @map("inactive_at") // When it becomes inactive
  
  // Defense tracking
  timesDefended   Int      @default(0) @map("times_defended")
  successfulDefenses Int   @default(0) @map("successful_defenses")
  totalDaysHeld   Int      @default(0) @map("total_days_held") // Cumulative across all holders
  
  // Grace period (first 30 days protection)
  gracePeriodEnds DateTime? @map("grace_period_ends")
  isFirstHolder   Boolean   @default(false) @map("is_first_holder")
  
  // Staking (when belt is at risk)
  isStaked        Boolean   @default(false) @map("is_staked")
  stakedInDebateId String?  @unique @map("staked_in_debate_id")
  stakedInDebate   Debate?  @relation("BeltStakedDebate", fields: [stakedInDebateId], references: [id])
  stakedInTournamentId String? @map("staked_in_tournament_id")
  stakedInTournament   Tournament? @relation("BeltStakedTournament", fields: [stakedInTournamentId], references: [id])
  
  // Tournament-specific belt
  tournamentId    String?  @map("tournament_id")
  tournament      Tournament? @relation("TournamentBelt", fields: [tournamentId], references: [id])
  
  // Belt design/customization
  designImageUrl  String?  @map("design_image_url")
  designColors    Json?    @map("design_colors") // { primary: "#FF0000", secondary: "#0000FF" }
  sponsorId       String?  @map("sponsor_id") // For sponsored belts
  sponsorName     String?  @map("sponsor_name")
  sponsorLogoUrl  String?  @map("sponsor_logo_url")
  
  // Coin value
  coinValue       Int      @default(0) @map("coin_value") // Current market value
  creationCost    Int      @default(0) @map("creation_cost") // Coins paid to create
  
  // Admin controls
  isActive        Boolean  @default(true) @map("is_active") // Can be deactivated by admin
  adminNotes      String?  @map("admin_notes")
  
  // Timestamps
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  // Relations
  history         BeltHistory[]
  challenges      BeltChallenge[]
  
  @@index([currentHolderId])
  @@index([type])
  @@index([category])
  @@index([status])
  @@index([tournamentId])
  @@index([stakedInDebateId])
  @@index([stakedInTournamentId])
  @@map("belts")
}
```

---

### 2. BeltHistory Model
Tracks all belt transfers and ownership changes.

```prisma
model BeltHistory {
  id              String   @id @default(uuid())
  beltId          String   @map("belt_id")
  belt            Belt     @relation(fields: [beltId], references: [id], onDelete: Cascade)
  
  // Transfer details
  fromUserId      String?  @map("from_user_id")
  fromUser        User?    @relation("BeltHistoryFrom", fields: [fromUserId], references: [id])
  toUserId        String?  @map("to_user_id")
  toUser          User?    @relation("BeltHistoryTo", fields: [toUserId], references: [id])
  
  // Transfer context
  reason          BeltTransferReason
  debateId        String?  @map("debate_id")
  debate          Debate?  @relation("BeltHistoryDebate", fields: [debateId], references: [id])
  tournamentId    String?  @map("tournament_id")
  tournament      Tournament? @relation("BeltHistoryTournament", fields: [tournamentId], references: [id])
  
  // Stats at time of transfer
  daysHeld        Int      @map("days_held")
  defensesWon     Int      @map("defenses_won")
  defensesLost    Int      @map("defenses_lost")
  
  // Admin notes (if manually transferred)
  adminNotes      String?  @map("admin_notes")
  transferredBy   String?  @map("transferred_by") // Admin user ID if manual transfer
  
  // Timestamps
  transferredAt   DateTime @default(now()) @map("transferred_at")
  
  @@index([beltId])
  @@index([fromUserId])
  @@index([toUserId])
  @@index([debateId])
  @@index([tournamentId])
  @@map("belt_history")
}
```

---

### 3. BeltChallenge Model
Tracks all belt challenges (head-to-head).

```prisma
model BeltChallenge {
  id              String   @id @default(uuid())
  beltId          String   @map("belt_id")
  belt            Belt     @relation(fields: [beltId], references: [id], onDelete: Cascade)
  
  // Participants
  challengerId    String   @map("challenger_id")
  challenger      User     @relation("BeltChallenger", fields: [challengerId], references: [id])
  beltHolderId    String   @map("belt_holder_id")
  beltHolder      User     @relation("BeltHolderChallenge", fields: [beltHolderId], references: [id])
  
  // Challenge details
  status          ChallengeStatus @default(PENDING)
  entryFee        Int      @default(0) @map("entry_fee") // Coins challenger pays
  coinReward      Int      @default(0) @map("coin_reward") // Coins winner gets
  
  // Response tracking
  response        ChallengeStatus? // ACCEPTED, DECLINED
  respondedAt     DateTime? @map("responded_at")
  declineCount    Int      @default(0) @map("decline_count") // Track declines for mandatory
  
  // Debate created from challenge
  debateId        String?  @unique @map("debate_id")
  debate          Debate?  @relation("BeltChallengeDebate", fields: [debateId], references: [id])
  
  // ELO matching (anti-abuse)
  challengerElo   Int      @map("challenger_elo")
  holderElo       Int      @map("holder_elo")
  eloDifference   Int      @map("elo_difference") // Absolute difference
  
  // Expiration
  expiresAt       DateTime @map("expires_at") // Challenge expires if not responded
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  @@index([beltId])
  @@index([challengerId])
  @@index([beltHolderId])
  @@index([status])
  @@index([debateId])
  @@map("belt_challenges")
}
```

---

### 4. BeltSettings Model
Admin-configurable settings for belt system.

```prisma
model BeltSettings {
  id              String   @id @default(uuid())
  
  // Belt type this applies to
  beltType        BeltType @unique @map("belt_type")
  
  // Defense periods (in days)
  defensePeriodDays       Int  @default(30) @map("defense_period_days")
  inactivityDays          Int  @default(30) @map("inactivity_days")
  mandatoryDefenseDays    Int  @default(60) @map("mandatory_defense_days")
  gracePeriodDays         Int  @default(30) @map("grace_period_days")
  
  // Challenge rules
  maxDeclines             Int  @default(2) @map("max_declines")
  challengeCooldownDays   Int  @default(7) @map("challenge_cooldown_days")
  challengeExpiryDays      Int  @default(3) @map("challenge_expiry_days")
  
  // ELO matching (anti-abuse)
  eloRange                Int  @default(200) @map("elo_range") // ±ELO points allowed
  activityRequirementDays  Int  @default(30) @map("activity_requirement_days")
  winStreakBonusMultiplier Float @default(1.2) @map("win_streak_bonus_multiplier") // Can challenge higher ELO
  
  // Coin economics
  entryFeeBase            Int  @default(100) @map("entry_fee_base")
  entryFeeMultiplier      Float @default(1.0) @map("entry_fee_multiplier") // Based on belt value
  winnerRewardPercent     Int  @default(60) @map("winner_reward_percent")
  loserConsolationPercent Int  @default(30) @map("loser_consolation_percent")
  platformFeePercent      Int  @default(10) @map("platform_fee_percent")
  
  // Tournament belt creation costs
  tournamentBeltCostSmall  Int  @default(500) @map("tournament_belt_cost_small") // 8 players
  tournamentBeltCostMedium Int  @default(1000) @map("tournament_belt_cost_medium") // 16 players
  tournamentBeltCostLarge  Int  @default(2000) @map("tournament_belt_cost_large") // 32+ players
  
  // Inactive belt rules
  inactiveCompetitorCount Int  @default(2) @map("inactive_competitor_count") // Top N can compete
  inactiveAcceptDays      Int  @default(7) @map("inactive_accept_days") // Days to accept challenge
  
  // Timestamps
  updatedAt       DateTime @updatedAt @map("updated_at")
  updatedBy       String?  @map("updated_by") // Admin user ID
  
  @@map("belt_settings")
}
```

---

### 5. User Model Additions
Add belt-related fields to existing User model.

```prisma
// Add to existing User model relations:
model User {
  // ... existing fields ...
  
  // Belt stats
  beltsHeld          Belt[]           @relation("BeltHolder")
  beltChallengesSent BeltChallenge[]  @relation("BeltChallenger")
  beltChallengesReceived BeltChallenge[] @relation("BeltHolderChallenge")
  beltHistoryFrom    BeltHistory[]    @relation("BeltHistoryFrom")
  beltHistoryTo      BeltHistory[]    @relation("BeltHistoryTo")
  
  // Belt stats (calculated fields, can be cached)
  totalBeltWins      Int      @default(0) @map("total_belt_wins")
  totalBeltDefenses  Int      @default(0) @map("total_belt_defenses")
  longestBeltHeld    Int      @default(0) @map("longest_belt_held") // Days
  currentBeltsCount  Int      @default(0) @map("current_belts_count") // Cached count
}
```

---

### 6. Debate Model Additions
Add belt-related fields to existing Debate model.

```prisma
// Add to existing Debate model:
model Debate {
  // ... existing fields ...
  
  // Belt relations
  stakedBelt        Belt?             @relation("BeltStakedDebate")
  beltChallenge     BeltChallenge?     @relation("BeltChallengeDebate")
  beltHistory       BeltHistory[]      @relation("BeltHistoryDebate")
  
  // Belt at stake indicator
  hasBeltAtStake    Boolean  @default(false) @map("has_belt_at_stake")
  beltStakeType     String?  @map("belt_stake_type") // "CHALLENGE", "TOURNAMENT", "MANDATORY"
}
```

---

### 7. Tournament Model Additions
Add belt-related fields to existing Tournament model.

```prisma
// Add to existing Tournament model:
model Tournament {
  // ... existing fields ...
  
  // Belt relations
  tournamentBelt    Belt?             @relation("TournamentBelt")
  stakedBelts       Belt[]            @relation("BeltStakedTournament")
  beltHistory       BeltHistory[]     @relation("BeltHistoryTournament")
  
  // Belt creation
  beltCreated       Boolean  @default(false) @map("belt_created")
  beltCreationCost  Int?     @map("belt_creation_cost") // Coins paid
  beltCreatedBy     String?  @map("belt_created_by") // User ID who paid
}
```

---

## Indexes Summary

### Performance Indexes
- `belts.current_holder_id` - Fast lookup of user's belts
- `belts.status` - Filter active/inactive belts
- `belts.type` - Filter by belt type
- `belts.category` - Filter category belts
- `belt_challenges.status` - Filter pending challenges
- `belt_history.belt_id` - Fast history lookup
- `belt_history.from_user_id` / `to_user_id` - User history

### Composite Indexes (if needed)
- `(current_holder_id, status)` - User's active belts
- `(type, category, status)` - Filter category belts by status

---

## Migration Strategy

### Phase 1: Core Models
1. Create enums
2. Create Belt model
3. Create BeltHistory model
4. Add relations to User, Debate, Tournament

### Phase 2: Challenge System
1. Create BeltChallenge model
2. Add challenge relations

### Phase 3: Settings & Admin
1. Create BeltSettings model
2. Seed default settings
3. Add admin fields

### Phase 4: Integration
1. Add belt fields to Debate
2. Add belt fields to Tournament
3. Add belt stats to User

---

## Data Integrity Considerations

1. **Belt Transfer Atomicity**: Use database transactions when transferring belts
2. **Staking Validation**: Ensure belt can only be staked in one place at a time
3. **Status Consistency**: Belt status must match reality (if staked, status should be STAKED)
4. **History Completeness**: Every belt transfer must have a history entry
5. **Challenge Uniqueness**: Only one active challenge per belt at a time

---

## Feature Flag Integration

All belt operations should check:
```typescript
const BELT_SYSTEM_ENABLED = process.env.ENABLE_BELT_SYSTEM === 'true'
const BELT_CHALLENGES_ENABLED = process.env.ENABLE_BELT_CHALLENGES === 'true'
const BELT_STAKING_ENABLED = process.env.ENABLE_BELT_STAKING === 'true'
```

---

## Next Steps

1. Review and approve schema
2. Create migration files
3. Implement core belt logic
4. Add admin interface
5. Add user interface (hidden until flag enabled)
6. Testing and refinement
