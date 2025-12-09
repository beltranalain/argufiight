# Project Status and Next Steps
**Last Updated:** December 10, 2024  
**Session:** King of the Hill Tournament Implementation + Google OAuth Fixes + Notification Error Investigation

## 🚨 **QUICK REFERENCE - START HERE**

### **Critical Issues:**
1. **Google OAuth 401 Errors** - Session cookie not persisting after OAuth callback
   - File: `app/api/auth/google/callback/route.ts`
   - Status: Partially fixed, still investigating cookie persistence

2. **Notification Raw SQL Error** - Boolean/integer type mismatch
   - File: `app/api/notifications/route.ts` (line 42)
   - Fix: Change `n.read = 0` to `n.read = false`
   - Status: Identified, ready to fix

### **GitHub Repository:**
- Remote: `argufight`
- URL: `https://github.com/argufight/argufight.git`
- Branch: `main`

### **Quick Commands:**
```bash
# Pull latest code
git pull argufight main

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push changes
git add -A
git commit -m "Your message"
git push argufight main
```

---

## 🎯 **CRITICAL ISSUES TO FIX IMMEDIATELY**

### 1. **Google OAuth Login - 401 Errors After Callback** ⚠️ HIGH PRIORITY
**Status:** Partially Fixed - Still Failing  
**Issue:** Users get "An error occurred during Google authentication" and 401 errors from `/api/auth/me` after Google OAuth callback

**What We've Tried:**
- ✅ Applied `debate_participants` migration to production database
- ✅ Added explicit session cookie setting in redirect response
- ✅ Added error handling for session creation failures
- ✅ Fixed account addition flow

**Current Problem:**
- Session cookie is being set but not persisting after redirect
- `/api/auth/me` returns 401 immediately after Google login
- Works for admin users previously, but now failing for all users

**Files Modified:**
- `app/api/auth/google/callback/route.ts` - Session creation and redirect logic
- `lib/auth/session.ts` - Session creation function
- `app/api/auth/me/route.ts` - Session verification

**Next Steps:**
1. Check if cookie domain/path settings are correct for production
2. Verify `AUTH_SECRET` environment variable is set correctly
3. Test cookie setting in redirect response - may need to use `Response` headers instead
4. Check if `secure` flag is causing issues (should be `true` in production)
5. Verify session is actually being created in database before redirect
6. Add more detailed logging to track cookie setting and verification

**Key Files:**
- `app/api/auth/google/callback/route.ts` (lines 281-380)
- `lib/auth/session.ts` (lines 14-52)
- `app/api/auth/me/route.ts` (lines 1-137)

---

### 2. **Notification System - Raw SQL Error** ⚠️ MEDIUM PRIORITY
**Status:** Identified - Ready to Fix  
**Issue:** Repeated errors in logs:
```
Raw SQL notification fetch failed, falling back to Prisma: Invalid `prisma.$queryRawUnsafe()` invocation: 
Raw query failed. Code: `42883`. Message: `ERROR: operator does not exist: boolean = integer 
HINT: No operator matches the given name and argument types. You might need to add explicit type casts.`
```

**Root Cause Found:**
- In `app/api/notifications/route.ts` line 42, the query uses `n.read = 0` (integer)
- But `read` is a `Boolean` field in the database (see `prisma/schema.prisma` line 1035)
- PostgreSQL cannot compare boolean to integer without explicit casting

**Exact Fix Needed:**
Change line 42 in `app/api/notifications/route.ts`:
```sql
-- CURRENT (WRONG):
WHERE n.user_id = $1 AND n.read = 0

-- SHOULD BE:
WHERE n.user_id = $1 AND n.read = false
-- OR:
WHERE n.user_id = $1 AND n.read = $3::boolean
```

**Files to Fix:**
- `app/api/notifications/route.ts` (line 42) - Change `n.read = 0` to `n.read = false`

**Next Steps:**
1. ✅ Fix line 42: Change `n.read = 0` to `n.read = false`
2. Test notification queries work correctly
3. Verify error no longer appears in logs

---

## ✅ **COMPLETED IN THIS SESSION**

### 1. **King of the Hill Tournament Format** ✅ COMPLETE
**Status:** Fully Implemented and Deployed

**What Was Built:**
- ✅ One Debate per round with all participants
- ✅ Real-time submissions visible to all participants
- ✅ AI evaluates all submissions together (single call, ranks all, eliminates bottom 25%)
- ✅ Cumulative scoring system tracks scores across rounds
- ✅ Finals automatically transitions to traditional 3-round debate when 2 remain
- ✅ Winner takes all scoring (champion receives all eliminated participants' scores)
- ✅ Elimination explanations stored and displayed
- ✅ Database schema updated with `cumulativeScore`, `eliminationRound`, `eliminationReason`

**Key Files:**
- `lib/tournaments/king-of-the-hill.ts` - Core logic
- `lib/tournaments/king-of-the-hill-ai.ts` - AI evaluation
- `lib/tournaments/match-generation.ts` - Match creation
- `lib/tournaments/round-advancement.ts` - Round progression
- `lib/tournaments/match-completion.ts` - Match completion handling
- `lib/tournaments/tournament-completion.ts` - Winner takes all scoring
- `app/api/debates/[id]/statements/route.ts` - Submission handling
- `app/(dashboard)/debate/[id]/page.tsx` - UI updates for real-time submissions
- `prisma/schema.prisma` - Database schema updates
- `prisma/migrations/20251210000003_add_king_of_the_hill_fields/migration.sql` - Migration applied

**Database Migrations Applied:**
- ✅ `20251210000001_add_debate_participants/migration.sql` - Applied to production
- ✅ `20251210000003_add_king_of_the_hill_fields/migration.sql` - Applied to production

---

### 2. **Database Fixes** ✅ COMPLETE
- ✅ Applied `debate_participants` table migration to production
- ✅ Applied King of the Hill fields migration to production
- ✅ Regenerated Prisma client after schema changes

---

## 📋 **PROJECT STRUCTURE**

### **GitHub Repository**
- **Remote Name:** `argufight`
- **URL:** `https://github.com/argufight/argufight.git`
- **Branch:** `main`
- **Note:** User has provided private key for GitHub access

### **Key Directories:**
```
/app/api/              - API routes
/app/(dashboard)/      - User-facing pages
/app/(auth)/           - Authentication pages
/app/admin/            - Admin dashboard
/components/           - React components
/lib/                  - Utility functions
/lib/tournaments/      - Tournament logic
/lib/auth/             - Authentication logic
/prisma/               - Database schema and migrations
/scripts/               - Utility scripts
```

---

## 🔧 **TECHNICAL DETAILS**

### **Environment Variables Needed:**
```env
# Authentication
AUTH_SECRET=                    # JWT secret for sessions
NEXT_PUBLIC_APP_URL=https://www.argufight.com

# Google OAuth
GOOGLE_CLIENT_ID=               # Can be set in AdminSettings or env
GOOGLE_CLIENT_SECRET=           # Can be set in AdminSettings or env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=   # Public client ID

# Database
DATABASE_URL=                   # PostgreSQL connection string

# AI Services
DEEPSEEK_API_KEY=               # For AI judging (can be in AdminSettings)

# Stripe (Live Keys)
STRIPE_SECRET_KEY=              # Can be in AdminSettings
STRIPE_PUBLISHABLE_KEY=         # Can be in AdminSettings

# Cron Jobs
CRON_SECRET=                    # For securing cron endpoints

# Firebase (On Hold - Last Phase)
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
FIREBASE_VAPID_KEY=
FIREBASE_SERVER_KEY=
```

### **Database:**
- **Provider:** PostgreSQL (Neon)
- **Connection:** `ep-long-math-a4am11rd-pooler.us-east-1.aws.neon.tech`
- **Schema:** Managed via Prisma
- **Migrations:** Applied via `npx prisma db execute` or `npx prisma migrate deploy`

---

## 🐛 **KNOWN ISSUES**

### 1. **Google OAuth 401 Errors** (CRITICAL)
- **Symptom:** After Google login, user redirected but `/api/auth/me` returns 401
- **Impact:** Users cannot log in via Google
- **Location:** `app/api/auth/google/callback/route.ts`
- **Last Attempt:** Set cookie explicitly in redirect response - still failing

### 2. **Notification Raw SQL Error** (MEDIUM)
- **Symptom:** Type casting errors in notification queries
- **Impact:** Performance degradation, error logs
- **Location:** Notification query code (needs investigation)

### 3. **Debate Participants Table** (RESOLVED)
- **Status:** ✅ Fixed - Migration applied
- **Was:** `debate_participants` table missing
- **Now:** Table exists and working

---

## 📝 **RECENT COMMITS**

### Latest Commits (Most Recent First):
1. `7cbccf8c` - Fix Google OAuth session cookie in redirect response
2. `4b2d79f3` - Fix Google OAuth callback and apply debate_participants migration
3. `34a43ea2` - Implement King of the Hill tournament format
4. `92270482` - Previous work...

**To Continue:**
```bash
git pull argufight main
```

---

## 🔍 **DEBUGGING GOOGLE OAUTH**

### **Current Flow:**
1. User clicks "Continue with Google" → `/api/auth/google`
2. Redirects to Google OAuth
3. Google redirects back → `/api/auth/google/callback?code=...&state=...`
4. Callback creates session via `createSession(user.id)`
5. Sets cookie in redirect response
6. Redirects to `/admin` (for admin) or `/` (for users)
7. **PROBLEM:** Cookie not persisting, `/api/auth/me` returns 401

### **Debugging Steps:**
1. Check Vercel logs for session creation success
2. Verify cookie is being set in response headers
3. Check browser DevTools → Application → Cookies to see if cookie exists
4. Verify `AUTH_SECRET` matches between environments
5. Check if `secure` flag is causing issues (should be `true` in production)
6. Verify session exists in database after creation
7. Check if cookie domain/path is correct

### **Potential Solutions:**
1. **Cookie Domain Issue:** May need to set `domain` explicitly
2. **Secure Flag:** In production, `secure: true` requires HTTPS
3. **SameSite Policy:** May need to adjust `sameSite: 'lax'` to `'none'` for cross-site
4. **Response Headers:** May need to set cookie via `Set-Cookie` header directly
5. **Timing Issue:** May need to wait for cookie to be set before redirect

---

## 🔔 **NOTIFICATION SYSTEM ISSUE**

### **Error Details:**
```
Raw SQL notification fetch failed, falling back to Prisma: 
Invalid `prisma.$queryRawUnsafe()` invocation: 
Raw query failed. Code: `42883`. 
Message: `ERROR: operator does not exist: boolean = integer 
HINT: No operator matches the given name and argument types. You might need to add explicit type casts.`
```

### **Fix Identified:**
**File:** `app/api/notifications/route.ts`  
**Line:** 42  
**Issue:** `n.read = 0` compares boolean field to integer  
**Fix:** Change to `n.read = false`

**Code Change:**
```typescript
// Line 42 - BEFORE:
WHERE n.user_id = $1 AND n.read = 0

// Line 42 - AFTER:
WHERE n.user_id = $1 AND n.read = false
```

### **Files to Fix:**
- ✅ `app/api/notifications/route.ts` (line 42) - Change `n.read = 0` to `n.read = false`

---

## 🚀 **DEPLOYMENT INFO**

### **Platform:** Vercel
### **Domain:** `www.argufight.com`
### **Environment:** Production

### **Build Command:**
```bash
npm run build
```

### **Deploy:**
- Automatic via GitHub push to `main` branch
- Or manual via Vercel dashboard

---

## 📚 **IMPORTANT FILES REFERENCE**

### **Authentication:**
- `app/api/auth/google/route.ts` - Initiates Google OAuth
- `app/api/auth/google/callback/route.ts` - Handles OAuth callback ⚠️ NEEDS FIX
- `app/api/auth/me/route.ts` - Gets current user (returns 401 after Google login)
- `lib/auth/session.ts` - Session creation
- `lib/auth/session-verify.ts` - Session verification

### **Tournaments:**
- `lib/tournaments/king-of-the-hill.ts` - King of the Hill logic ✅
- `lib/tournaments/king-of-the-hill-ai.ts` - AI evaluation ✅
- `lib/tournaments/match-generation.ts` - Match creation
- `lib/tournaments/round-advancement.ts` - Round progression
- `lib/tournaments/match-completion.ts` - Match completion
- `lib/tournaments/tournament-completion.ts` - Tournament completion

### **Database:**
- `prisma/schema.prisma` - Database schema
- `prisma/migrations/` - Migration files

---

## 🎯 **IMMEDIATE ACTION ITEMS**

### **Priority 1: Fix Google OAuth**
1. ✅ Verify session is created in database
2. ✅ Check cookie is set in redirect response
3. ⚠️ **TODO:** Verify cookie persists after redirect
4. ⚠️ **TODO:** Check browser DevTools for cookie
5. ⚠️ **TODO:** Test with different cookie settings
6. ⚠️ **TODO:** Add detailed logging

### **Priority 2: Fix Notification Error**
1. ✅ **DONE:** Found the raw SQL query (line 42 in `app/api/notifications/route.ts`)
2. ⚠️ **TODO:** Change `n.read = 0` to `n.read = false` on line 42
3. ⚠️ **TODO:** Test notification queries work correctly
4. ⚠️ **TODO:** Verify error no longer appears in production logs

---

## 📖 **HOW TO CONTINUE**

### **1. Pull Latest Code:**
```bash
git pull argufight main
```

### **2. Install Dependencies:**
```bash
npm install
```

### **3. Generate Prisma Client:**
```bash
npx prisma generate
```

### **4. Check Environment Variables:**
- Verify all required env vars are set in Vercel
- Check `AUTH_SECRET` is correct
- Verify Google OAuth credentials

### **5. Test Google OAuth:**
- Check Vercel function logs for errors
- Use browser DevTools to inspect cookies
- Test the full OAuth flow

### **6. Fix Notification Error:**
- ✅ **Identified:** Line 42 in `app/api/notifications/route.ts` - change `n.read = 0` to `n.read = false`
- Fix the boolean comparison
- Test notification queries
- Verify error no longer appears in logs

---

## 🔐 **GITHUB CONNECTION**

### **Repository:**
- **Remote:** `argufight`
- **URL:** `https://github.com/argufight/argufight.git`
- **Branch:** `main`

### **To Push Changes:**
```bash
git add -A
git commit -m "Your commit message"
git push argufight main
```

### **Note:** User has provided private key for GitHub access. Use the `argufight` remote, not `origin`.

---

## 📊 **PROJECT HEALTH**

### **✅ Working:**
- King of the Hill tournaments (fully implemented)
- Regular authentication (email/password)
- Tournament system (Bracket, Championship, King of the Hill)
- Database migrations
- Most API endpoints

### **⚠️ Needs Fix:**
- Google OAuth login (401 errors)
- Notification raw SQL queries (type casting)

### **📋 On Hold:**
- Firebase push notifications (user requested to add to "last phase")

---

## 🎓 **KEY LEARNINGS FROM THIS SESSION**

1. **King of the Hill Format:**
   - One Debate per round with all participants
   - AI evaluates all submissions together
   - Bottom 25% eliminated each round
   - Winner takes all scoring in finals

2. **Google OAuth Issue:**
   - Cookies set via `cookies().set()` may not persist in redirect responses
   - Need to explicitly set cookie in `NextResponse.redirect()` response object
   - Still investigating why cookie isn't persisting

3. **Database Migrations:**
   - Use `npx prisma db execute --file` for manual migrations
   - Always regenerate Prisma client after schema changes

---

## 📞 **SUPPORT INFO**

### **Database Connection:**
- Host: `ep-long-math-a4am11rd-pooler.us-east-1.aws.neon.tech`
- Provider: Neon PostgreSQL
- Schema: Managed via Prisma

### **Deployment:**
- Platform: Vercel
- Auto-deploy: Yes (on push to main)
- Environment: Production

---

## 🚨 **CRITICAL REMINDERS**

1. **Always use `argufight` remote for GitHub, not `origin`**
2. **Test Google OAuth in production (Vercel) - local may behave differently**
3. **Check Vercel function logs for detailed error messages**
4. **Verify `AUTH_SECRET` is set correctly in Vercel environment variables**
5. **Cookie `secure` flag must be `true` in production (requires HTTPS)**
6. **Always regenerate Prisma client after schema changes: `npx prisma generate`**

---

## 📝 **NEXT SESSION CHECKLIST**

- [ ] Pull latest code from `argufight` remote
- [ ] Review Vercel logs for Google OAuth errors
- [ ] Test Google OAuth flow in browser DevTools
- [ ] Fix session cookie persistence issue
- [ ] Find and fix notification raw SQL query
- [ ] Test both fixes in production
- [ ] Verify all users (including admin) can log in with Google

---

**End of Status Document**

