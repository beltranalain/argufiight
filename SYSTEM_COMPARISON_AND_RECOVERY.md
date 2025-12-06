# System Comparison & Recovery Guide

## Current Status Check

### ✅ What IS Present (Code is There!)

**Database Models (in `prisma/schema.prisma`):**
- ✅ `UserSubscription` - Subscription management
- ✅ `PromoCode` - Promo code system
- ✅ `UsageTracking` - Feature usage tracking
- ✅ `Advertiser` - Advertiser accounts
- ✅ `Campaign` - Advertising campaigns
- ✅ `Offer` - Creator offers
- ✅ `AdContract` - Signed contracts
- ✅ `Impression` - Ad impression tracking
- ✅ `Click` - Ad click tracking
- ✅ `CreatorTaxInfo` - Creator tax information

**Admin Pages:**
- ✅ `app/admin/platform-ads/page.tsx` - Platform ads management
- ✅ `app/admin/creator-marketplace/page.tsx` - Creator marketplace management
- ✅ `app/admin/subscriptions/promo-codes/page.tsx` - Promo code management
- ✅ `app/admin/settings/page.tsx` - Settings with advertising toggles

**API Routes:**
- ✅ `app/api/ads/select/route.ts` - Ad selection
- ✅ `app/api/ads/track/route.ts` - Ad tracking
- ✅ `app/api/subscriptions/*` - Subscription APIs
- ✅ `app/api/admin/promo-codes/*` - Promo code APIs
- ✅ `app/api/advertiser/*` - Advertiser APIs
- ✅ `app/api/creator/*` - Creator APIs

**Library Files:**
- ✅ `lib/ads/config.ts` - Ad configuration helpers
- ✅ `lib/ads/helpers.ts` - Ad helper functions
- ✅ `lib/subscriptions/features.ts` - Feature constants
- ✅ `lib/subscriptions/subscription-utils.ts` - Subscription utilities
- ✅ `lib/subscriptions/feature-gate.ts` - Feature gating
- ✅ `lib/stripe/stripe-client.ts` - Stripe integration

**Migrations:**
- ✅ `20251205163351_add_subscription_models` - Subscription system
- ✅ `20251205173302_add_advertising_system` - Advertising system

---

## Key Commits (When Things Were Added)

### Subscription System
- **Commit:** `c5fa3ae7` - "Add subscription system: Free/Pro tiers, Stripe integration, promo codes"
- **Date:** Dec 5, 2025
- **Files Added:** 17 files, 2650+ lines

### Advertising System
- **Commit:** `414cf9c5` - "Add advertising system (Phases 1-8)"
- **Date:** Dec 5, 2025
- **Files Added:** 30+ files

---

## Potential Issues

### 1. Database Migrations Not Applied
**Problem:** Code exists but database tables don't exist
**Check:**
```bash
# Check if migrations were run
npx prisma migrate status
```

**Fix:**
```bash
# Run migrations
npx prisma migrate deploy
# Or for development
npx prisma migrate dev
```

### 2. Wrong Repository/Branch
**Problem:** Looking at wrong GitHub repo or branch
**Current Setup:**
- **Remote:** `argufight` → `https://github.com/argufight/argufight.git` ✅
- **Remote:** `origin` → `https://github.com/beltranalain/Honorable.AI.git` (old)
- **Branch:** `main` ✅

**Check:**
```bash
git remote -v
git branch -a
```

### 3. Database Connection Issues
**Problem:** Can't connect to database, so models appear "missing"
**Check:**
- Vercel environment variables: `DATABASE_URL`, `DIRECT_URL`
- Database provider (Neon, Vercel Postgres, etc.)
- Connection string format

---

## Recovery Steps

### Step 1: Verify Current State

```bash
# Check current commit
git log --oneline -1

# Check what files exist
ls app/admin/platform-ads/
ls app/admin/creator-marketplace/
ls app/admin/subscriptions/

# Check schema
grep -n "model Advertiser\|model Campaign\|model UserSubscription" prisma/schema.prisma
```

### Step 2: Check Database State

```bash
# Check migration status
npx prisma migrate status

# Check if tables exist (if you have database access)
npx prisma db pull  # This will show what's actually in the database
```

### Step 3: Rollback to Specific Commit (If Needed)

**To rollback to advertising implementation:**
```bash
# Find the commit
git log --oneline --all | grep -i "advertis"

# Create a backup branch first
git branch backup-before-rollback

# Reset to that commit (CAREFUL - this will lose newer commits)
git reset --hard 414cf9c5

# Or create a new branch from that commit
git checkout -b restore-advertising 414cf9c5
```

**To rollback to subscription implementation:**
```bash
git checkout -b restore-subscription c5fa3ae7
```

### Step 4: Re-apply Migrations

If database is missing tables:

```bash
# Generate Prisma Client
npx prisma generate

# Deploy migrations (production)
npx prisma migrate deploy

# Or for development
npx prisma migrate dev
```

---

## Comparison: What Should Be vs What Is

### Database Models Checklist

| Model | Should Exist | Actually Exists | Status |
|-------|-------------|-----------------|--------|
| UserSubscription | ✅ | ✅ | ✅ Present |
| PromoCode | ✅ | ✅ | ✅ Present |
| UsageTracking | ✅ | ✅ | ✅ Present |
| Advertiser | ✅ | ✅ | ✅ Present |
| Campaign | ✅ | ✅ | ✅ Present |
| Offer | ✅ | ✅ | ✅ Present |
| AdContract | ✅ | ✅ | ✅ Present |
| Impression | ✅ | ✅ | ✅ Present |
| Click | ✅ | ✅ | ✅ Present |
| CreatorTaxInfo | ✅ | ✅ | ✅ Present |

### Admin Pages Checklist

| Page | Should Exist | Actually Exists | Status |
|------|-------------|-----------------|--------|
| `/admin/platform-ads` | ✅ | ✅ | ✅ Present |
| `/admin/creator-marketplace` | ✅ | ✅ | ✅ Present |
| `/admin/subscriptions/promo-codes` | ✅ | ✅ | ✅ Present |
| `/admin/settings` (with ads section) | ✅ | ✅ | ✅ Present |

### API Routes Checklist

| Route | Should Exist | Actually Exists | Status |
|-------|-------------|-----------------|--------|
| `/api/ads/select` | ✅ | ✅ | ✅ Present |
| `/api/ads/track` | ✅ | ✅ | ✅ Present |
| `/api/subscriptions/*` | ✅ | ✅ | ✅ Present |
| `/api/admin/promo-codes/*` | ✅ | ✅ | ✅ Present |
| `/api/advertiser/*` | ✅ | ✅ | ✅ Present |
| `/api/creator/*` | ✅ | ✅ | ✅ Present |

---

## What Might Be "Missing" (Common Issues)

### 1. Database Tables Not Created
**Symptom:** Code exists but queries fail with "table doesn't exist"
**Solution:** Run migrations

### 2. Environment Variables Not Set
**Symptom:** Stripe/other integrations don't work
**Solution:** Check Vercel environment variables

### 3. Prisma Client Not Generated
**Symptom:** TypeScript errors about missing types
**Solution:** `npx prisma generate`

### 4. Wrong Database Connection
**Symptom:** Can't query data
**Solution:** Verify `DATABASE_URL` in Vercel

---

## Rollback Instructions

### Option 1: Soft Rollback (Create New Branch)

```bash
# Create branch from advertising commit
git checkout -b restore-advertising-system 414cf9c5

# Push to remote
git push argufight restore-advertising-system

# Switch back to main
git checkout main
```

### Option 2: Hard Rollback (Dangerous - Loses Recent Commits)

```bash
# BACKUP FIRST!
git branch backup-$(date +%Y%m%d)

# Reset to advertising commit
git reset --hard 414cf9c5

# Force push (CAREFUL!)
git push argufight main --force
```

### Option 3: Cherry-Pick Specific Commits

```bash
# See what commits you want
git log --oneline 414cf9c5..HEAD

# Cherry-pick specific commits
git cherry-pick <commit-hash>
```

---

## Verification Commands

### Check if Everything is There

```bash
# Check models in schema
grep -c "model Advertiser\|model Campaign\|model UserSubscription" prisma/schema.prisma

# Check if files exist
test -f app/admin/platform-ads/page.tsx && echo "✅ Platform Ads page exists" || echo "❌ Missing"
test -f app/admin/creator-marketplace/page.tsx && echo "✅ Creator Marketplace page exists" || echo "❌ Missing"
test -f lib/ads/config.ts && echo "✅ Ad config exists" || echo "❌ Missing"
test -f lib/subscriptions/features.ts && echo "✅ Subscription features exist" || echo "❌ Missing"

# Check migrations
ls prisma/migrations/*advertising* && echo "✅ Advertising migration exists" || echo "❌ Missing"
ls prisma/migrations/*subscription* && echo "✅ Subscription migration exists" || echo "❌ Missing"
```

---

## Next Steps

1. **Verify Database State**
   - Check if migrations were applied
   - Run `npx prisma migrate status`
   - If missing, run `npx prisma migrate deploy`

2. **Check Environment**
   - Verify you're on correct branch (`main`)
   - Verify correct remote (`argufight`)
   - Check Vercel is connected to `argufight/argufight`

3. **If Code is Missing**
   - Check if you're on the right commit
   - Compare with commits `414cf9c5` (advertising) and `c5fa3ae7` (subscription)
   - Use rollback instructions above

4. **If Database is Missing**
   - Run migrations: `npx prisma migrate deploy`
   - Verify connection: Check `DATABASE_URL`
   - Check Vercel environment variables

---

## Quick Recovery Commands

```bash
# 1. Verify current state
git log --oneline -5
git status

# 2. Check if files exist
ls app/admin/platform-ads/
ls app/admin/creator-marketplace/

# 3. Check database schema
grep "model Advertiser" prisma/schema.prisma

# 4. Check migrations
npx prisma migrate status

# 5. If needed, regenerate Prisma Client
npx prisma generate

# 6. If needed, run migrations
npx prisma migrate deploy
```

---

## Important Notes

- **Code IS present** - All files exist in the repository
- **Models ARE in schema** - All database models are defined
- **Migrations exist** - Both subscription and advertising migrations are present
- **Issue is likely:** Database migrations not applied, or wrong environment

**Most likely issue:** The database tables don't exist because migrations weren't run, even though the code is there.

