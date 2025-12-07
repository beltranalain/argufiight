# Vercel 500 Error - Quick Summary

## The Problem
- ❌ 500 error on `/api/auth/signup`
- ❌ Internal server error when trying to log in
- ❌ 404 error for favicon.ico (minor)

## Most Likely Causes (in order)

### 1. Missing DATABASE_URL (90% of cases)
**Fix:** Add `DATABASE_URL` in Vercel Environment Variables

### 2. Missing AUTH_SECRET
**Fix:** Generate and add `AUTH_SECRET` in Vercel Environment Variables

### 3. Database Not Migrated
**Fix:** Run `npx prisma migrate deploy`

### 4. Wrong DATABASE_URL Format
**Fix:** Verify connection string is correct PostgreSQL format

---

## Quick Fix (5 minutes)

### Step 1: Check What's Missing
Visit: `https://your-site.vercel.app/api/test-db`

This will tell you exactly what's wrong.

### Step 2: Add Missing Environment Variables

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

**Required:**
- `DATABASE_URL` - Your PostgreSQL connection string
- `AUTH_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `NEXT_PUBLIC_APP_URL` - Your domain (e.g., `https://honorable-ai.com`)

**Make sure to select:** Production, Preview, Development for each!

### Step 3: Run Migrations

```powershell
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Pull env vars
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy
```

### Step 4: Redeploy

Vercel Dashboard → Deployments → Latest → Three dots (⋯) → Redeploy

---

## Test It

1. Visit: `https://your-site.vercel.app/api/test-db`
   - Should show: `"status": "ok"` and `"connected": true`

2. Try signing up on your site
   - Should work now!

---

## Still Not Working?

1. **Check Vercel Function Logs:**
   - Deployments → Latest → Functions → `/api/auth/signup` → View Logs
   - This shows the actual error

2. **Verify Database:**
   - Make sure database is accessible
   - Check connection string format
   - Verify database allows connections from Vercel

3. **See Full Guide:**
   - Read `FIX_VERCEL_500_ERROR.md` for detailed troubleshooting

---

## Favicon 404 Fix (Optional)

The favicon 404 is harmless but to fix it:

1. Add `favicon.ico` to `public/` folder
2. Or add to `app/` folder as `icon.ico` (Next.js 13+)

This is cosmetic only - doesn't affect functionality.



