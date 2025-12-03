# PART 3: DATABASE SCHEMA

Complete Prisma schema for all platform data.

---

## OVERVIEW

This part covers:
- Complete Prisma schema
- Database migrations
- Judge personalities seed data
- Database query utilities
- Admin settings table (for API keys)

---

## PRISMA SETUP

### 1. Install Prisma

```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

This creates:
- `prisma/schema.prisma`
- `.env` file (merge with .env.local)

### 2. Update DATABASE_URL

In `.env.local`:
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
```

---

## COMPLETE SCHEMA

### File: prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ============================================
// USER MANAGEMENT
// ============================================

model Profile {
  id        String   @id @default(uuid())
  email     String   @unique
  username  String   @unique
  avatarUrl String?  @map("avatar_url")
  bio       String?
  
  // Stats
  eloRating    Int @default(1200) @map("elo_rating")
  debatesWon   Int @default(0)    @map("debates_won")
  debatesLost  Int @default(0)    @map("debates_lost")
  debatesTied  Int @default(0)    @map("debates_tied")
  totalDebates Int @default(0)    @map("total_debates")
  
  // Permissions
  isAdmin  Boolean @default(false) @map("is_admin")
  isBanned Boolean @default(false) @map("is_banned")
  
  // Moderation
  strikes        Int      @default(0)
  bannedUntil    DateTime? @map("banned_until")
  banReason      String?   @map("ban_reason")
  rankedBanned   Boolean   @default(false) @map("ranked_banned")
  
  // Timestamps
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt      @map("updated_at")
  
  // Relations
  challengerDebates Debate[]      @relation("Challenger")
  opponentDebates   Debate[]      @relation("Opponent")
  statements        Statement[]
  notifications     Notification[]
  chatMessages      ChatMessage[]
  reports           Report[]
  predictions       Prediction[]
  
  @@map("profiles")
  @@index([eloRating])
  @@index([username])
}

// ============================================
// DEBATES
// ============================================

model Debate {
  id          String       @id @default(uuid())
  topic       String
  description String?
  category    DebateCategory
  
  // Participants
  challengerId String   @map("challenger_id")
  challenger   Profile  @relation("Challenger", fields: [challengerId], references: [id], onDelete: Cascade)
  
  opponentId   String?  @map("opponent_id")
  opponent     Profile? @relation("Opponent", fields: [opponentId], references: [id], onDelete: SetNull)
  
  // Positions
  challengerPosition DebatePosition @map("challenger_position")
  opponentPosition   DebatePosition @map("opponent_position")
  
  // Configuration
  totalRounds    Int     @default(5) @map("total_rounds")
  currentRound   Int     @default(1) @map("current_round")
  roundDuration  Int     @default(86400000) @map("round_duration") // milliseconds (24h default)
  speedMode      Boolean @default(false) @map("speed_mode")
  
  // Status
  status         DebateStatus @default(WAITING)
  
  // Verdict
  winnerId       String?      @map("winner_id")
  verdictReached Boolean      @default(false) @map("verdict_reached")
  verdictDate    DateTime?    @map("verdict_date")
  
  // Metadata
  spectatorCount Int      @default(0) @map("spectator_count")
  featured       Boolean  @default(false)
  
  // ELO changes
  challengerEloChange Int? @map("challenger_elo_change")
  opponentEloChange   Int? @map("opponent_elo_change")
  
  // Timestamps
  startedAt   DateTime? @map("started_at")
  endedAt     DateTime? @map("ended_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt      @map("updated_at")
  
  // Round deadlines
  roundDeadline DateTime? @map("round_deadline")
  
  // Relations
  statements    Statement[]
  verdicts      Verdict[]
  chatMessages  ChatMessage[]
  notifications Notification[]
  reports       Report[]
  predictions   Prediction[]
  
  @@map("debates")
  @@index([status])
  @@index([category])
  @@index([createdAt])
  @@index([challengerId])
  @@index([opponentId])
}

enum DebateCategory {
  SPORTS
  POLITICS
  TECH
  ENTERTAINMENT
  SCIENCE
  OTHER
}

enum DebatePosition {
  FOR
  AGAINST
}

enum DebateStatus {
  WAITING       // Waiting for opponent
  ACTIVE        // Debate in progress
  COMPLETED     // Debate finished, awaiting verdict
  VERDICT_READY // AI judges decided
  CANCELLED     // Cancelled before completion
}

// ============================================
// STATEMENTS (Arguments)
// ============================================

model Statement {
  id       String @id @default(uuid())
  debateId String @map("debate_id")
  debate   Debate @relation(fields: [debateId], references: [id], onDelete: Cascade)
  
  authorId String  @map("author_id")
  author   Profile @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  round   Int
  content String @db.Text
  
  // Moderation
  flagged       Boolean   @default(false)
  flaggedReason String?   @map("flagged_reason")
  moderatedAt   DateTime? @map("moderated_at")
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt      @map("updated_at")
  
  @@map("statements")
  @@unique([debateId, authorId, round])
  @@index([debateId])
  @@index([authorId])
}

// ============================================
// AI JUDGES
// ============================================

model Judge {
  id          String @id @default(uuid())
  name        String @unique
  personality String
  emoji       String
  description String @db.Text
  
  // System prompt for this judge
  systemPrompt String @map("system_prompt") @db.Text
  
  // Stats
  debatesJudged Int @default(0) @map("debates_judged")
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt      @map("updated_at")
  
  // Relations
  verdicts Verdict[]
  
  @@map("judges")
}

// ============================================
// VERDICTS
// ============================================

model Verdict {
  id       String @id @default(uuid())
  debateId String @map("debate_id")
  debate   Debate @relation(fields: [debateId], references: [id], onDelete: Cascade)
  
  judgeId String @map("judge_id")
  judge   Judge  @relation(fields: [judgeId], references: [id], onDelete: Cascade)
  
  // Decision
  winnerId   String?     @map("winner_id")
  decision   VerdictDecision
  reasoning  String      @db.Text
  
  // Scores
  challengerScore Int? @map("challenger_score") // 0-100
  opponentScore   Int? @map("opponent_score")   // 0-100
  
  createdAt DateTime @default(now()) @map("created_at")
  
  @@map("verdicts")
  @@unique([debateId, judgeId])
  @@index([debateId])
}

enum VerdictDecision {
  CHALLENGER_WINS
  OPPONENT_WINS
  TIE
}

// ============================================
// NOTIFICATIONS
// ============================================

model Notification {
  id        String           @id @default(uuid())
  userId    String           @map("user_id")
  user      Profile          @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type      NotificationType
  title     String
  message   String
  
  // Optional debate reference
  debateId  String?          @map("debate_id")
  debate    Debate?          @relation(fields: [debateId], references: [id], onDelete: Cascade)
  
  read      Boolean          @default(false)
  readAt    DateTime?        @map("read_at")
  
  createdAt DateTime         @default(now()) @map("created_at")
  
  @@map("notifications")
  @@index([userId])
  @@index([read])
}

enum NotificationType {
  DEBATE_TURN        // Your turn to argue
  DEBATE_ACCEPTED    // Your challenge was accepted
  ROUND_ENDING       // Round ending soon
  VERDICT_READY      // AI judges decided
  DEBATE_WON         // You won
  DEBATE_LOST        // You lost
  DEBATE_TIED        // Debate tied
  NEW_CHALLENGE      // Someone challenged you
  OPPONENT_SUBMITTED // Opponent submitted argument
}

// ============================================
// CHAT
// ============================================

model ChatMessage {
  id       String @id @default(uuid())
  debateId String @map("debate_id")
  debate   Debate @relation(fields: [debateId], references: [id], onDelete: Cascade)
  
  authorId String  @map("author_id")
  author   Profile @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  content String
  
  // Moderation
  deleted     Boolean   @default(false)
  deletedAt   DateTime? @map("deleted_at")
  deletedBy   String?   @map("deleted_by")
  
  createdAt DateTime @default(now()) @map("created_at")
  
  @@map("chat_messages")
  @@index([debateId])
  @@index([authorId])
  @@index([createdAt])
}

// ============================================
// MODERATION
// ============================================

model Report {
  id       String     @id @default(uuid())
  
  // What's being reported
  debateId    String?    @map("debate_id")
  debate      Debate?    @relation(fields: [debateId], references: [id], onDelete: Cascade)
  
  // Who reported
  reporterId  String     @map("reporter_id")
  reporter    Profile    @relation(fields: [reporterId], references: [id], onDelete: Cascade)
  
  // Report details
  reason      String
  description String?    @db.Text
  
  // Status
  status      ReportStatus @default(PENDING)
  reviewedBy  String?      @map("reviewed_by")
  reviewedAt  DateTime?    @map("reviewed_at")
  resolution  String?      @db.Text
  
  createdAt DateTime @default(now()) @map("created_at")
  
  @@map("reports")
  @@index([status])
}

enum ReportStatus {
  PENDING
  REVIEWING
  RESOLVED
  DISMISSED
}

// ============================================
// PREDICTIONS (Spectator betting)
// ============================================

model Prediction {
  id       String  @id @default(uuid())
  debateId String  @map("debate_id")
  debate   Debate  @relation(fields: [debateId], references: [id], onDelete: Cascade)
  
  userId   String  @map("user_id")
  user     Profile @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Prediction
  predictedWinnerId String @map("predicted_winner_id")
  confidence        Int    // 1-5 stars
  
  // Result
  correct   Boolean?  
  points    Int?      // Points earned/lost
  
  createdAt DateTime @default(now()) @map("created_at")
  
  @@map("predictions")
  @@unique([debateId, userId])
  @@index([userId])
}

// ============================================
// ADMIN SETTINGS (API Keys)
// ============================================

model AdminSetting {
  id    String @id @default(uuid())
  key   String @unique
  value String @db.Text
  
  // Encryption flag
  encrypted Boolean @default(false)
  
  // Metadata
  description String?
  category    String?
  
  updatedBy String?   @map("updated_by")
  updatedAt DateTime  @updatedAt @map("updated_at")
  createdAt DateTime  @default(now()) @map("created_at")
  
  @@map("admin_settings")
  @@index([category])
}

// ============================================
// SEED DEBATES (AI-generated sample debates)
// ============================================

model SeedDebate {
  id              String         @id @default(uuid())
  topic           String
  category        DebateCategory
  challengerName  String         @map("challenger_name")
  opponentName    String         @map("opponent_name")
  
  // Pre-generated content
  statements      Json // Array of {round, author, content}
  verdictData     Json @map("verdict_data") // Pre-generated verdicts
  
  featured        Boolean @default(false)
  
  createdAt DateTime @default(now()) @map("created_at")
  
  @@map("seed_debates")
  @@index([category])
}
```

---

## DATABASE MIGRATIONS

### Generate and run migrations:

```bash
# Generate migration
npx prisma migrate dev --name init

# This will:
# 1. Create migration files
# 2. Apply to database
# 3. Generate Prisma Client
```

---

## SEED DATA - JUDGE PERSONALITIES

### File: prisma/seed.ts

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const JUDGES = [
  {
    name: 'The Empiricist',
    personality: 'data-driven',
    emoji: '🔬',
    description: 'Values hard data, peer-reviewed research, and empirical evidence above all else. Dismisses emotional appeals and anecdotes.',
    systemPrompt: `You are The Empiricist, an AI judge who values empirical evidence and scientific rigor above all else.

JUDGING CRITERIA:
1. Quality and credibility of sources cited
2. Use of peer-reviewed research and data
3. Logical consistency and statistical validity
4. Avoidance of anecdotal evidence
5. Clear cause-and-effect relationships

SCORING:
- Award higher scores for arguments backed by studies, statistics, and expert consensus
- Penalize emotional appeals, anecdotes, and unsupported claims
- Value precision and measurable outcomes

TONE: Clinical, analytical, focused on facts and data.

Analyze both debaters' arguments across all rounds and decide who made the stronger empirical case. Provide reasoning focused on evidence quality.`,
  },
  {
    name: 'The Rhetorician',
    personality: 'persuasion-focused',
    emoji: '🎭',
    description: 'Judges based on persuasive power, emotional resonance, and communication skill. Values storytelling and connection.',
    systemPrompt: `You are The Rhetorician, an AI judge who values persuasive power and communication excellence.

JUDGING CRITERIA:
1. Clarity and eloquence of expression
2. Emotional resonance and storytelling
3. Ability to connect with audience
4. Use of rhetorical devices and structure
5. Memorability and impact of arguments

SCORING:
- Reward compelling narratives and vivid examples
- Value emotional intelligence and audience awareness
- Appreciate clever wordplay and memorable phrases
- Penalize dry, inaccessible, or confusing arguments

TONE: Appreciative of artful communication, focused on persuasive impact.

Analyze both debaters' arguments and decide who was more persuasive and compelling. Explain which rhetorical strategies worked best.`,
  },
  {
    name: 'The Logician',
    personality: 'logic-focused',
    emoji: '🧮',
    description: 'Analyzes pure logical structure. Identifies fallacies, values sound reasoning, and demands internal consistency.',
    systemPrompt: `You are The Logician, an AI judge who evaluates arguments based on logical structure and validity.

JUDGING CRITERIA:
1. Logical validity and soundness of arguments
2. Absence of logical fallacies
3. Internal consistency
4. Clear premises leading to conclusions
5. Handling of counterarguments

SCORING:
- Reward airtight logical structures
- Heavily penalize fallacies (ad hominem, strawman, false dichotomy, etc.)
- Value consistency across all rounds
- Appreciate acknowledgment of argument limitations

TONE: Precise, focused on reasoning structure and validity.

Analyze the logical structure of both debaters' arguments. Identify any fallacies and evaluate whose reasoning was most sound.`,
  },
  {
    name: 'The Pragmatist',
    personality: 'practical',
    emoji: '🔧',
    description: 'Focuses on real-world applicability and practical consequences. Values feasibility over theory.',
    systemPrompt: `You are The Pragmatist, an AI judge who values practical outcomes and real-world applicability.

JUDGING CRITERIA:
1. Real-world feasibility and implementation
2. Practical consequences and outcomes
3. Cost-benefit analysis
4. Consideration of constraints and trade-offs
5. Actionability of proposals

SCORING:
- Reward arguments grounded in reality
- Value consideration of implementation challenges
- Appreciate cost-benefit thinking
- Penalize purely theoretical arguments divorced from practice

TONE: Grounded, focused on what actually works in the real world.

Evaluate whose arguments are more practically sound and implementable. Consider real-world constraints and likely outcomes.`,
  },
  {
    name: 'The Ethicist',
    personality: 'moral-focused',
    emoji: '⚖️',
    description: 'Evaluates arguments through moral and ethical frameworks. Considers fairness, rights, and societal impact.',
    systemPrompt: `You are The Ethicist, an AI judge who evaluates arguments through moral and ethical lenses.

JUDGING CRITERIA:
1. Ethical implications and moral reasoning
2. Fairness and justice considerations
3. Respect for rights and dignity
4. Societal impact and consequences
5. Consistency with ethical frameworks

SCORING:
- Reward consideration of moral dimensions
- Value fairness and equity in reasoning
- Appreciate acknowledgment of ethical trade-offs
- Penalize arguments that ignore moral implications

TONE: Thoughtful, focused on ethics and values.

Analyze the ethical dimensions of both arguments. Consider which position is more morally defensible and just.`,
  },
  {
    name: 'The Devil\'s Advocate',
    personality: 'contrarian',
    emoji: '😈',
    description: 'Plays contrarian, finds flaws in both sides, and challenges assumptions. Hardest to please.',
    systemPrompt: `You are The Devil's Advocate, an AI judge who challenges every argument and finds flaws in all positions.

JUDGING CRITERIA:
1. Identification of weaknesses in both arguments
2. Challenging unstated assumptions
3. Exposing gaps in reasoning
4. Testing edge cases and counterexamples
5. Overall argument resilience

SCORING:
- Be skeptical of both sides
- Reward arguments that anticipate objections
- Value intellectual humility and acknowledgment of limits
- Penalize overconfidence and unexamined assumptions

TONE: Critical, challenging, focused on finding weak points.

Critically examine both arguments. Point out flaws, questionable assumptions, and weaknesses. Award the win to whoever better withstood scrutiny.`,
  },
  {
    name: 'The Historian',
    personality: 'context-focused',
    emoji: '📚',
    description: 'Judges based on historical context, precedent, and long-term patterns. Values learning from the past.',
    systemPrompt: `You are The Historian, an AI judge who evaluates arguments through historical context and precedent.

JUDGING CRITERIA:
1. Use of historical examples and precedent
2. Understanding of context and patterns
3. Learning from past successes and failures
4. Long-term perspective over short-term
5. Cultural and temporal awareness

SCORING:
- Reward historical literacy and precedent
- Value contextualized arguments
- Appreciate lessons from history
- Penalize ahistorical or presentist thinking

TONE: Contextual, focused on historical patterns and precedent.

Evaluate both arguments through a historical lens. Consider which position better accounts for historical context and lessons learned.`,
  },
]

async function main() {
  console.log('Seeding database...')

  // Clear existing judges
  await prisma.judge.deleteMany()

  // Create judges
  for (const judge of JUDGES) {
    await prisma.judge.create({
      data: judge,
    })
    console.log(`Created judge: ${judge.name}`)
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### Add seed script to package.json:

```json
{
  "scripts": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### Run seed:

```bash
npm install -D tsx
npm run seed
```

---

## PRISMA CLIENT SETUP

### File: lib/db/prisma.ts

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## READY FOR PART 4

Part 3 complete! You now have:
- Complete database schema
- All tables and relationships
- Judge personalities seeded
- Admin settings table for API keys
- Prisma client setup

**Are you ready for PART 4?**

Part 4 will cover:
- Reusable UI components (Card, Modal, Badge, etc.)
- Component library matching design system
- No HTML templates needed (simpler components)

Say "ready" when you want to continue!
