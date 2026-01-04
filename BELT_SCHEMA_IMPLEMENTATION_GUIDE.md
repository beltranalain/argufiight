# Belt System Schema Implementation Guide

## Overview
This guide provides step-by-step instructions for safely adding the belt system to your existing Prisma schema.

---

## Step 1: Review Current Schema

Before making changes, ensure you understand:
- Current User model structure
- Current Debate model structure  
- Current Tournament model structure
- Existing enums and their usage

---

## Step 2: Add Enums First

Add these enums to your `schema.prisma` file (before any models that use them):

```prisma
enum BeltType {
  ROOKIE
  CATEGORY
  CHAMPIONSHIP
  UNDEFEATED
  TOURNAMENT
}

enum BeltStatus {
  ACTIVE
  INACTIVE
  VACANT
  STAKED
  GRACE_PERIOD
  MANDATORY
}

enum ChallengeStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
  CANCELLED
  COMPLETED
}

enum BeltTransferReason {
  DEBATE_WIN
  TOURNAMENT_WIN
  MANDATORY_LOSS
  INACTIVITY
  ADMIN_TRANSFER
  CHALLENGE_WIN
  FORFEIT
}
```

---

## Step 3: Add New Models

Copy the four new models from `belt-system-schema-additions.prisma`:
1. `Belt`
2. `BeltHistory`
3. `BeltChallenge`
4. `BeltSettings`

Add them to the end of your `schema.prisma` file.

---

## Step 4: Modify Existing User Model

### Add Fields (after existing stats fields, around line 31):

```prisma
  // Belt stats
  totalBeltWins      Int      @default(0) @map("total_belt_wins")
  totalBeltDefenses  Int      @default(0) @map("total_belt_defenses")
  longestBeltHeld    Int      @default(0) @map("longest_belt_held") // Days
  currentBeltsCount  Int      @default(0) @map("current_belts_count") // Cached count
```

### Add Relations (in the Relations section, around line 100):

```prisma
  // Belt relations
  beltsHeld          Belt[]           @relation("BeltHolder")
  beltChallengesSent BeltChallenge[]  @relation("BeltChallenger")
  beltChallengesReceived BeltChallenge[] @relation("BeltHolderChallenge")
  beltHistoryFrom    BeltHistory[]    @relation("BeltHistoryFrom")
  beltHistoryTo      BeltHistory[]    @relation("BeltHistoryTo")
```

---

## Step 5: Modify Existing Debate Model

### Add Fields (after existing fields, around line 910):

```prisma
  // Belt at stake indicator
  hasBeltAtStake    Boolean  @default(false) @map("has_belt_at_stake")
  beltStakeType     String?  @map("belt_stake_type") // "CHALLENGE", "TOURNAMENT", "MANDATORY"
```

### Add Relations (in the Relations section, around line 933):

```prisma
  // Belt relations
  stakedBelt        Belt?             @relation("BeltStakedDebate")
  beltChallenge     BeltChallenge?     @relation("BeltChallengeDebate")
  beltHistory       BeltHistory[]      @relation("BeltHistoryDebate")
```

---

## Step 6: Modify Existing Tournament Model

### Add Fields (after existing fields, around line 1965):

```prisma
  // Belt creation
  beltCreated       Boolean  @default(false) @map("belt_created")
  beltCreationCost  Int?     @map("belt_creation_cost") // Coins paid
  beltCreatedBy     String?  @map("belt_created_by") // User ID who paid
```

### Add Relations (in the Relations section, around line 1970):

```prisma
  // Belt relations
  tournamentBelt    Belt?             @relation("TournamentBelt")
  stakedBelts       Belt[]            @relation("BeltStakedTournament")
  beltHistory       BeltHistory[]     @relation("BeltHistoryTournament")
```

---

## Step 7: Create Migration

After adding all the schema changes:

```bash
# Generate migration (dry run first)
npx prisma migrate dev --name add_belt_system --create-only

# Review the generated migration SQL
# Check: prisma/migrations/[timestamp]_add_belt_system/migration.sql

# Apply migration
npx prisma migrate dev --name add_belt_system
```

---

## Step 8: Seed Default Settings

Create a seed script to populate `BeltSettings`:

```typescript
// prisma/seed-belt-settings.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const beltTypes = ['ROOKIE', 'CATEGORY', 'CHAMPIONSHIP', 'UNDEFEATED', 'TOURNAMENT']
  
  for (const type of beltTypes) {
    await prisma.beltSettings.upsert({
      where: { beltType: type },
      update: {},
      create: {
        beltType: type,
        // Default values from schema
        defensePeriodDays: 30,
        inactivityDays: 30,
        mandatoryDefenseDays: 60,
        gracePeriodDays: 30,
        maxDeclines: 2,
        challengeCooldownDays: 7,
        challengeExpiryDays: 3,
        eloRange: 200,
        activityRequirementDays: 30,
        winStreakBonusMultiplier: 1.2,
        entryFeeBase: 100,
        entryFeeMultiplier: 1.0,
        winnerRewardPercent: 60,
        loserConsolationPercent: 30,
        platformFeePercent: 10,
        tournamentBeltCostSmall: 500,
        tournamentBeltCostMedium: 1000,
        tournamentBeltCostLarge: 2000,
        inactiveCompetitorCount: 2,
        inactiveAcceptDays: 7,
      },
    })
  }
  
  console.log('Belt settings seeded successfully!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Run it:
```bash
npx tsx prisma/seed-belt-settings.ts
```

---

## Step 9: Verify Schema

```bash
# Format schema
npx prisma format

# Generate Prisma Client
npx prisma generate

# Verify no errors
npx prisma validate
```

---

## Step 10: Test Database Connection

```bash
# Test connection
npx prisma db pull  # Should not make changes if schema matches DB
```

---

## Safety Checklist

Before deploying:

- [ ] All enums added
- [ ] All models added
- [ ] All relations added to existing models
- [ ] All fields added to existing models
- [ ] Migration generated and reviewed
- [ ] Default settings seeded
- [ ] Prisma Client regenerated
- [ ] Schema validated
- [ ] Feature flags set to `false` in environment
- [ ] Backup database before migration (production)

---

## Rollback Plan

If something goes wrong:

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back [migration_name]

# Or manually revert in database
# Drop tables in reverse order:
# - belt_challenges
# - belt_history
# - belt_settings
# - belts
# - Remove enum types
# - Remove columns from User, Debate, Tournament
```

---

## Next Steps After Schema

1. Create belt logic functions (`lib/belts/`)
2. Create API routes (`app/api/belts/`)
3. Create admin interface (`app/admin/belts/`)
4. Create user interface (hidden until flag enabled)
5. Add feature flags
6. Test thoroughly before enabling

---

## Notes

- All belt operations should be wrapped in database transactions
- Use feature flags to enable/disable belt system
- Monitor database performance after migration
- Consider adding database indexes if queries are slow
- Keep belt settings in sync with admin UI changes
