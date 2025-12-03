# HONORABLE AI - COMPLETE BUILD GUIDE

## PROJECT OVERVIEW

Honorable AI is a horizontal-scrolling debate platform where AI judges decide winners. Users create debates, argue their positions over 5 rounds (24 hours each), and receive verdicts from 3 randomly-selected AI judges with distinct personalities.

**Key Differentiators:**
- Unique horizontal UI (like dating apps, not traditional forums)
- AI judges eliminate bias and scale infinitely
- ELO ranking system for competitive debaters
- Live chat for spectators
- Pure black cyberpunk aesthetic

---

## TECH STACK

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion (animations)
- Radix UI (components)

**Backend:**
- Next.js API Routes
- Supabase (PostgreSQL + Auth + Realtime)
- Prisma ORM
- DeepSeek API (AI judges)

**Infrastructure:**
- Vercel (hosting)
- Supabase (database)
- Resend (email)
- Uploadthing (file uploads)

---

## PROJECT STRUCTURE

```
honorable-ai/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Horizontal homepage
│   │   ├── debate/
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Live debate view
│   │   ├── profile/
│   │   │   └── [username]/
│   │   │       └── page.tsx
│   │   └── leaderboard/
│   │       └── page.tsx
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Admin dashboard
│   │   ├── users/
│   │   ├── debates/
│   │   ├── moderation/
│   │   ├── settings/
│   │   │   └── page.tsx          # API keys config
│   │   └── seed-debates/
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   ├── debates/
│   │   ├── verdicts/
│   │   ├── ai/
│   │   │   └── generate-verdict/
│   │   └── admin/
│   │       └── settings/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── auth/
│   ├── debate/
│   ├── admin/
│   ├── layout/
│   └── ui/
├── lib/
│   ├── ai/
│   │   ├── deepseek.ts
│   │   └── judges.ts
│   ├── db/
│   │   ├── prisma.ts
│   │   └── queries.ts
│   ├── auth/
│   ├── notifications/
│   └── utils/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   └── html-templates/           # Reference HTML files
│       ├── auth-page.html
│       ├── homepage.html
│       ├── debate-view.html
│       └── admin-dashboard.html
├── .env.local
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## BUILD PHASES

### PART 1: Foundation (You are here)
- Project structure
- Environment setup
- Database schema
- Design system

### PART 2: Authentication
- Supabase auth setup
- Login/signup pages
- Protected routes

### PART 3: Core Database
- Prisma schema
- Database migrations
- Seed data structure

### PART 4: UI Components
- Design system
- Reusable components
- HTML reference templates

### PART 5: Horizontal Homepage
- Panel-based layout
- Debate feed
- Navigation system

### PART 6: Debate System
- Create debate flow
- Round management
- Submission system

### PART 7: AI Integration
- DeepSeek setup (admin config)
- Judge personalities
- Verdict generation

### PART 8: Admin Dashboard
- User management
- Moderation queue
- Settings (API keys)
- Seed debates tool

### PART 9: Additional Features
- Notifications
- Live chat
- ELO ranking
- Profile pages

### PART 10: Testing & Launch
- End-to-end testing
- Performance optimization
- Deployment

---

## ENVIRONMENT SETUP

### Prerequisites
- Node.js 18+
- npm or yarn
- Git
- Supabase account
- DeepSeek API account (admin will configure)

### Initial Setup

1. **Create Next.js project:**
```bash
npx create-next-app@latest honorable-ai
# Select: TypeScript, Tailwind, App Router, src/ directory: No
cd honorable-ai
```

2. **Install dependencies:**
```bash
npm install @prisma/client @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install framer-motion @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install openai resend uploadthing
npm install -D prisma
```

3. **Initialize Prisma:**
```bash
npx prisma init
```

4. **Create .env.local:**
```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email (Resend)
RESEND_API_KEY="re_..."

# File Uploads (Uploadthing)
UPLOADTHING_SECRET="sk_..."
UPLOADTHING_APP_ID="..."

# AI Keys - These will be stored in database and configured via admin
# These are fallback only
DEEPSEEK_API_KEY=""
```

---

## COLOR SYSTEM

Pure black cyberpunk aesthetic with neon accents.

**Background:**
- Primary: #000000 (pure black)
- Secondary: #0a0a0a (slightly lighter black)
- Tertiary: #1a1a1a (border gray)

**Brand Colors:**
- Electric Blue: #00D9FF (primary accent)
- Neon Orange: #FF6B35 (secondary accent)
- Hot Pink: #FF006E (highlight)
- Cyber Green: #00FF94 (live/active states)

**Text:**
- Primary: #FFFFFF (white)
- Secondary: #A0A0A0 (gray)
- Muted: #666666 (dark gray)

**Gradients:**
- Blue to Orange: linear-gradient(135deg, #00D9FF 0%, #FF6B35 100%)
- Pink to Blue: linear-gradient(135deg, #FF006E 0%, #00D9FF 100%)
- Green to Pink: linear-gradient(135deg, #00FF94 0%, #FF006E 100%)

---

## DESIGN PRINCIPLES

1. **No Hardcoded Data:** Everything from database
2. **Admin Configuration:** API keys in admin settings
3. **Production Ready:** Build for launch, test thoroughly
4. **Cyberpunk Aesthetic:** Dark, neon, futuristic
5. **Horizontal Flow:** Unique panel-based navigation
6. **Zero Mockups:** Real data or empty states only

---

## NEXT STEPS

This is Part 1 of 10. Each part will include:
- Detailed implementation guides
- Complete code files
- HTML reference templates where needed
- Cursor.ai prompts
- Testing instructions

---

**Ready for Part 2 (Authentication Setup)?**

Reply "ready" and I'll continue with the authentication system including Supabase setup, login/signup pages with HTML templates, and protected routes.
