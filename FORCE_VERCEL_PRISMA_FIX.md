# Force Vercel to Use PostgreSQL Schema

## The Problem
Vercel is still using a cached Prisma Client generated with SQLite, even though the schema file is correct (PostgreSQL).

## Root Cause
Vercel caches `node_modules` including the generated Prisma Client. The cached client was generated with the old SQLite schema.

## Solution: Force Complete Rebuild

### Step 1: Commit Latest Changes

```powershell
cd C:\Users\beltr\Honorable.AI
git add .
git commit -m "Fix: Force Prisma Client regeneration - clear all caches"
git push
```

### Step 2: Clear Vercel Build Cache (CRITICAL)

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Click your project

2. **Clear Build Cache:**
   - Settings → General
   - Scroll to "Build & Development Settings"
   - Click **"Clear Build Cache"**
   - Confirm

3. **Clear Deployment Cache:**
   - Go to **Deployments** tab
   - Click the **three dots (⋯)** on the latest deployment
   - Click **"Redeploy"**
   - **IMPORTANT:** Turn **OFF** "Use existing Build Cache"
   - Click **"Redeploy"**

### Step 3: Verify Build Logs

After redeploy starts, check the build logs. You should see:

```
✅ Schema is configured for PostgreSQL
🧹 Cleaning build artifacts and caches...
✅ Cleaned .next directory
✅ Cleaned Prisma cache: node_modules/.prisma
🔄 Force regenerating Prisma Client for PostgreSQL...
✅ Prisma Client regenerated successfully!
```

### Step 4: Test After Deployment

1. **Test Database Connection:**
   - Visit: `https://honorable-ai.com/api/test-db`
   - Should show: `"status": "connected"` ✅

2. **Test Signup:**
   - Visit: `https://honorable-ai.com/signup`
   - Try creating an account
   - Should work without 500 error ✅

---

## What I Fixed

1. ✅ Updated `scripts/clean-build.js` - Now clears Prisma cache too
2. ✅ Created `.vercelignore` - Prevents caching Prisma client
3. ✅ Build script already verifies schema and regenerates Prisma

---

## If Still Not Working

If you still get the SQLite error after clearing cache and redeploying:

### Option 1: Delete and Recreate Vercel Project
1. Create a new Vercel project
2. Connect the same GitHub repo
3. Add all environment variables
4. Deploy fresh

### Option 2: Check Environment Variables
Make sure `DATABASE_URL` in Vercel is:
- Set for **Production**, **Preview**, AND **Development**
- Starts with `postgres://` or `postgresql://`
- Not a SQLite path (`file:`)

### Option 3: Manual Prisma Generate on Vercel
Add this to `package.json` scripts:
```json
"vercel-build": "node scripts/verify-schema.js && node scripts/clean-build.js && node scripts/regenerate-prisma.js && next build"
```

Then in Vercel Settings → General → Build Command, set it to:
```
npm run vercel-build
```

---

## Expected Build Output

When the build works correctly, you should see in Vercel logs:

```
Running "npm run build"
> honorable.ai@1.0.1 build
> node scripts/verify-schema.js && node scripts/clean-build.js && node scripts/regenerate-prisma.js && next build && node scripts/verify-build.js

🔍 Verifying Prisma schema...
✅ Schema is configured for PostgreSQL
🧹 Cleaning build artifacts and caches...
✅ Cleaned .next directory
✅ Cleaned Prisma cache: node_modules/.prisma
🔄 Force regenerating Prisma Client for PostgreSQL...
  → DATABASE_URL is set (PostgreSQL connection)
  → Regenerating Prisma Client with PostgreSQL provider...
✔ Generated Prisma Client (v6.19.0) to ./node_modules/@prisma/client
✅ Prisma Client regenerated successfully!
```

If you see `provider = "sqlite"` anywhere in the logs, the schema file is wrong or cached.

