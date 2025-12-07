# Fix Vercel SQLite Error - Schema Provider Mismatch

## The Problem
Vercel is showing this error:
```
Error validating datasource `db`: the URL must start with the protocol `file:`.
--> schema.prisma:10
| 9 | provider = "sqlite"
```

This means Vercel is using a **cached build** with the old SQLite schema, even though your local schema is correct (PostgreSQL).

## Solution: Force Vercel to Rebuild

### Step 1: Commit and Push Changes

Run these in PowerShell:

```powershell
cd C:\Users\beltr\Honorable.AI

# Check what files changed
git status

# Add all changes
git add .

# Commit
git commit -m "Fix: Ensure PostgreSQL schema for production"

# Push to trigger Vercel rebuild
git push
```

### Step 2: Clear Vercel Build Cache

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **General**
3. Scroll down to **"Clear Build Cache"**
4. Click **"Clear"**
5. Go to **Deployments** tab
6. Click **"Redeploy"** on the latest deployment
7. Select **"Use existing Build Cache"** = **OFF**
8. Click **"Redeploy"**

### Step 3: Verify Build

After redeploy, check the build logs. You should see:
```
✅ Schema is configured for PostgreSQL
✅ Prisma Client regenerated successfully!
```

### Step 4: Test the Fix

1. Visit: `https://honorable-ai.com/api/test-db`
2. Should show: `"status": "connected"` ✅
3. Try signing up: `https://honorable-ai.com/signup`
4. Should work without 500 error ✅

---

## What I Fixed

1. ✅ Created `scripts/verify-schema.js` - Verifies schema is PostgreSQL before building
2. ✅ Updated `package.json` build script - Runs schema verification first
3. ✅ Schema file already correct (`provider = "postgresql"`)
4. ✅ Migration lock already fixed (`provider = "postgresql"`)

---

## If Still Not Working

If you still get the error after clearing cache and redeploying:

1. **Check Vercel Environment Variables:**
   - Go to Settings → Environment Variables
   - Make sure `DATABASE_URL` is set correctly (PostgreSQL connection string)
   - Should start with: `postgres://` or `postgresql://`

2. **Check Build Logs:**
   - Go to Deployments → Latest → Build Logs
   - Look for: `✅ Schema is configured for PostgreSQL`
   - If you see errors, share them

3. **Manual Fix (Last Resort):**
   - Delete `.next` folder locally
   - Run: `npm run build` locally to test
   - If it works locally, the issue is Vercel cache
   - Force redeploy without cache


