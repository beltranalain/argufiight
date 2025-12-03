# HONORABLE AI - COMPLETE BUILD GUIDE

**The world's first AI-judged debate platform with horizontal UI**

Built by: Donkey Ideas  
Tech Stack: Next.js 14, TypeScript, Tailwind CSS, Supabase, Prisma, DeepSeek AI

---

## 📋 TABLE OF CONTENTS

1. [Quick Start](#quick-start)
2. [Project Overview](#project-overview)
3. [Build Parts (1-10)](#build-parts)
4. [File Structure](#file-structure)
5. [Key Features](#key-features)
6. [Deployment](#deployment)

---

## 🚀 QUICK START

### Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- DeepSeek API key (get from platform.deepseek.com)
- Git & GitHub account
- Vercel account (for deployment)

### Installation (5 minutes)

```bash
# 1. Create Next.js project
npx create-next-app@latest honorable-ai
cd honorable-ai

# 2. Install dependencies
npm install @prisma/client @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install framer-motion @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install openai resend uploadthing
npm install -D prisma tsx

# 3. Initialize Prisma
npx prisma init

# 4. Set up environment variables
# Copy from Part 1 (00-START-HERE.md)

# 5. Run migrations
npx prisma migrate dev --name init

# 6. Seed judges
npm run seed

# 7. Start development server
npm run dev
```

---

## 📖 PROJECT OVERVIEW

### What is Honorable AI?

A revolutionary debate platform where users engage in structured arguments judged by AI personalities. Features include:

- **Horizontal Scrolling UI** - Unique 4-panel navigation system
- **AI Judges** - 7 distinct judge personalities (Empiricist, Rhetorician, Logician, etc.)
- **ELO Ranking** - Competitive ranking system like chess
- **Live Features** - Real-time chat, notifications, spectator mode
- **Speed Mode** - Fast-paced 3-round debates with 1-hour deadlines
- **Admin Dashboard** - Complete platform management and API key configuration

### Core Philosophy

- **Zero hardcoded data** - Everything from database
- **Production-ready** - Built for launch, not prototyping
- **Admin-configurable** - API keys stored in database, not just .env
- **Pixel-perfect design** - Pure black cyberpunk aesthetic

---

## 📚 BUILD PARTS

Work through these in order. Each part is self-contained with complete code and Cursor.ai prompts.

### PART 1: Project Foundation
**File:** `00-START-HERE.md`

What you'll build:
- Project structure and tech stack
- Environment setup
- Color system and design principles
- Development workflow

Time: 2-4 hours

---

### PART 2: Authentication System
**File:** `01-AUTHENTICATION.md`  
**HTML Template:** `html-templates/auth-login.html`, `auth-signup.html`  
**Prompts:** `01-AUTHENTICATION-PROMPTS.md`

What you'll build:
- Supabase authentication
- Login/signup pages with pixel-perfect design
- Email validation and password strength
- Profile auto-creation
- Protected routes middleware

Time: 4-6 hours

---

### PART 3: Database Schema
**File:** `02-DATABASE-SCHEMA.md`

What you'll build:
- Complete Prisma schema
- All 15 database tables
- Judge personalities with system prompts
- Admin settings table
- Database migrations

Time: 2-3 hours

---

### PART 4: UI Components Library
**File:** `03-UI-COMPONENTS.md`

What you'll build:
- 10 reusable components
- Card, Modal, Badge, Avatar, Tabs
- Dropdown, Loading, Empty State
- Toast notifications system
- Tooltip

Time: 3-4 hours

---

### PART 5: Horizontal Homepage
**File:** `04-HORIZONTAL-HOMEPAGE.md`  
**HTML Template:** `html-templates/homepage-horizontal.html`

What you'll build:
- 4-panel horizontal layout
- Snap-scrolling navigation
- Top navigation bar
- Arena panel (debate feed)
- Trending topics
- Navigation dots

Time: 5-7 hours

---

### PART 6: Debate System
**File:** `05-DEBATE-SYSTEM.md`

What you'll build:
- Create debate modal
- Accept challenge flow
- Round-by-round submissions
- Debate status management
- API routes for all operations

Time: 6-8 hours

---

### PART 7: AI Integration
**File:** `06-AI-INTEGRATION.md`

What you'll build:
- DeepSeek API client
- Verdict generation system
- 3 random judges per debate
- ELO calculation
- Beautiful verdict display
- API key retrieval from database

Time: 4-5 hours

---

### PART 8: Admin Dashboard
**File:** `07-ADMIN-DASHBOARD.md`

What you'll build:
- Admin-only layout
- Dashboard with stats
- Settings page (API keys)
- User management
- Platform configuration

Time: 3-4 hours

---

### PART 9: Additional Features
**File:** `08-ADDITIONAL-FEATURES.md`

What you'll build:
- Notification system with dropdown
- Live chat in debates
- ELO leaderboard
- User profile pages
- Challenges panel
- Profile panel

Time: 5-6 hours

---

### PART 10: Testing & Launch
**File:** `09-TESTING-AND-LAUNCH.md`

What you'll do:
- Complete testing checklist
- Performance optimization
- SEO and metadata
- Deploy to Vercel
- Post-launch monitoring

Time: 4-6 hours

---

## 📁 FILE STRUCTURE

```
honorable-ai/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── page.tsx                    # Horizontal homepage
│   │   └── debate/
│   │       └── [id]/
│   │           └── page.tsx            # Individual debate
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Dashboard
│   │   └── settings/
│   │       └── page.tsx                # API keys
│   ├── api/
│   │   ├── debates/
│   │   │   ├── route.ts                # List/create
│   │   │   └── [id]/
│   │   │       ├── route.ts            # Get debate
│   │   │       ├── accept/
│   │   │       │   └── route.ts
│   │   │       ├── submit/
│   │   │       │   └── route.ts
│   │   │       └── chat/
│   │   │           └── route.ts
│   │   ├── verdicts/
│   │   │   └── generate/
│   │   │       └── route.ts
│   │   ├── notifications/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── read/
│   │   │           └── route.ts
│   │   ├── leaderboard/
│   │   │   └── route.ts
│   │   └── admin/
│   │       └── settings/
│   │           └── route.ts
│   ├── layout.tsx
│   ├── globals.css
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── auth/
│   │   └── AuthLayout.tsx
│   ├── layout/
│   │   ├── TopNav.tsx
│   │   ├── HorizontalContainer.tsx
│   │   ├── Panel.tsx
│   │   ├── NavigationDots.tsx
│   │   └── NotificationDropdown.tsx
│   ├── panels/
│   │   ├── ArenaPanel.tsx
│   │   ├── LiveBattlePanel.tsx
│   │   ├── ChallengesPanel.tsx
│   │   ├── ProfilePanel.tsx
│   │   └── LeaderboardPanel.tsx
│   ├── debate/
│   │   ├── DebateCard.tsx
│   │   ├── TrendingTopics.tsx
│   │   ├── CreateDebateModal.tsx
│   │   ├── SubmitArgumentForm.tsx
│   │   ├── VerdictDisplay.tsx
│   │   └── LiveChat.tsx
│   ├── admin/
│   │   ├── AdminNav.tsx
│   │   └── StatCard.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       ├── Badge.tsx
│       ├── Avatar.tsx
│       ├── Tabs.tsx
│       ├── DropdownMenu.tsx
│       ├── Loading.tsx
│       ├── EmptyState.tsx
│       ├── Toast.tsx
│       └── Tooltip.tsx
├── lib/
│   ├── ai/
│   │   └── deepseek.ts
│   ├── db/
│   │   └── prisma.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── utils/
│   │   ├── utils.ts
│   │   └── validation.ts
│   └── hooks/
│       └── useAuth.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   └── html-templates/
│       ├── auth-login.html
│       ├── auth-signup.html
│       └── homepage-horizontal.html
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## ✨ KEY FEATURES

### 1. Horizontal Navigation
- Unique 4-panel layout
- Smooth snap-scrolling
- Panel 1: Arena (debate feed)
- Panel 2: Live Battle (active debate)
- Panel 3: Open Challenges
- Panel 4: User Profile

### 2. AI Judge System
7 distinct judge personalities:
1. **The Empiricist** - Data-driven, values research
2. **The Rhetorician** - Persuasion and storytelling
3. **The Logician** - Pure logic, identifies fallacies
4. **The Pragmatist** - Real-world feasibility
5. **The Ethicist** - Moral reasoning
6. **The Devil's Advocate** - Finds flaws in everything
7. **The Historian** - Historical context

### 3. Debate Flow
1. User creates debate (topic, category, position)
2. Opponent accepts challenge
3. 5 rounds of arguments (or 3 in speed mode)
4. AI judges analyze and vote
5. ELO ratings updated
6. Winner announced

### 4. ELO Ranking
- Chess-style rating system
- Starts at 1200
- Gains/losses based on opponent rating
- Displayed on leaderboard
- Affects matchmaking

### 5. Live Features
- Real-time chat in debates
- Push notifications
- Spectator mode
- Live debate status

### 6. Admin Dashboard
- User management
- Debate moderation
- API key configuration (DeepSeek, Resend)
- Platform settings
- Analytics

---

## 🎨 DESIGN SYSTEM

### Colors
```css
Background:
  Primary: #000000 (pure black)
  Secondary: #0a0a0a
  Tertiary: #1a1a1a

Brand Colors:
  Electric Blue: #00D9FF (primary)
  Neon Orange: #FF6B35 (secondary)
  Hot Pink: #FF006E (highlight)
  Cyber Green: #00FF94 (live/success)

Text:
  Primary: #FFFFFF
  Secondary: #A0A0A0
  Muted: #666666

Gradients:
  Blue-to-Orange: buttons, CTAs
  Pink-to-Blue: special elements
  Green-to-Pink: success states
```

### Typography
- Font: System font stack (-apple-system, BlinkMacSystemFont, etc.)
- Headers: Bold, 24-48px
- Body: Regular, 14-16px
- UI: Medium, 12-14px

### Components
- Cards: bg-secondary, border-tertiary, rounded-xl
- Buttons: Gradient backgrounds, hover effects
- Inputs: Dark backgrounds, electric-blue focus
- Badges: Category colors, gradient backgrounds

---

## 🚀 DEPLOYMENT

### Vercel (Recommended)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/honorable-ai.git
git push -u origin main
```

2. **Deploy on Vercel**
- Go to vercel.com
- Import GitHub repository
- Add environment variables (see Part 10)
- Deploy

3. **Post-Deployment**
- Run database migrations
- Seed judges
- Make yourself admin
- Configure API keys in dashboard

### Environment Variables

Required:
```env
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

Optional (can set in admin dashboard):
```env
DEEPSEEK_API_KEY=
RESEND_API_KEY=
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
```

---

## 📊 ESTIMATED TIMELINE

| Phase | Time | Description |
|-------|------|-------------|
| Setup & Auth | 6-10 hours | Parts 1-2 |
| Database & UI | 5-7 hours | Parts 3-4 |
| Homepage | 5-7 hours | Part 5 |
| Core Features | 10-13 hours | Parts 6-7 |
| Admin & Polish | 8-10 hours | Parts 8-9 |
| Testing & Deploy | 4-6 hours | Part 10 |
| **TOTAL** | **38-53 hours** | Full build |

Realistic timeline: **1-2 weeks** working part-time

---

## 🎯 SUCCESS METRICS

Track these after launch:
- User signups
- Debates created/day
- Debates completed/day
- Average verdict quality
- User retention (7-day, 30-day)
- ELO distribution
- API costs (DeepSeek usage)
- Page load times
- Error rates

---

## 🆘 SUPPORT

### Documentation
Each part includes:
- Complete code examples
- Cursor.ai prompts
- Implementation order
- Testing guidelines

### Troubleshooting
See Part 10 for common issues and solutions.

### Resources
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Prisma: https://www.prisma.io/docs
- DeepSeek: https://platform.deepseek.com/docs

---

## 🏆 YOU'VE GOT THIS!

This build guide contains everything you need to launch a production-ready debate platform. Every line of code, every component, every API route is documented and ready to implement.

**Follow the parts in order, use the Cursor.ai prompts, and you'll have a functioning platform in 1-2 weeks.**

Good luck! 🚀

---

**Built with ❤️ by Donkey Ideas**

*Turning unconventional ideas into AI-powered products*

---

## 📝 VERSION HISTORY

- **v1.0** - Initial complete build guide
  - 10 comprehensive parts
  - 3 HTML templates
  - 30+ Cursor.ai prompts
  - Full deployment guide

---

**Last Updated:** December 2024
