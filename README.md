# Honorable AI

**The world's first AI-judged debate platform with horizontal UI**

A revolutionary debate platform where users engage in structured arguments judged by AI personalities. Features include horizontal-scrolling UI, ELO ranking system, and AI-powered verdicts.

## 🚀 Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Next.js API Routes, Supabase (PostgreSQL + Auth + Realtime)
- **Database:** Prisma ORM
- **AI:** DeepSeek API (AI judges)
- **Hosting:** Vercel

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Supabase account
- DeepSeek API account (for AI judges)

## 🛠️ Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```
   Then fill in your Supabase and API keys.

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)**

## 📁 Project Structure

```
honorable-ai/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/      # Main app routes
│   ├── admin/            # Admin dashboard
│   └── api/              # API routes
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── auth/             # Auth components
│   ├── layout/           # Layout components
│   ├── panels/           # Homepage panels
│   ├── debate/           # Debate components
│   └── admin/            # Admin components
├── lib/                  # Utilities and helpers
│   ├── supabase/         # Supabase clients
│   ├── db/               # Database utilities
│   ├── ai/               # AI integration
│   └── utils/            # General utilities
├── prisma/               # Prisma schema and migrations
└── public/               # Static assets
```

## 🎨 Design System

**Pure Black Cyberpunk Aesthetic**

- Background: Pure black (#000000)
- Electric Blue: #00D9FF (primary accent)
- Neon Orange: #FF6B35 (secondary accent)
- Hot Pink: #FF006E (highlight)
- Cyber Green: #00FF94 (live/active states)

## 📚 Documentation

See the `Notes/` directory for complete build documentation:
- `BUILD-GUIDE.md` - Complete build guide
- `PROJECT-SCOPE.md` - Project phases and scope
- `PROJECT-TRACKER.md` - Progress tracking

## 🚧 Development Status

Currently in **Phase 0: Project Setup** ✅

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 📄 License

ISC

---

**Built with ❤️ by Donkey Ideas**






