# Recreate Vercel Project - Fresh Start

Since Vercel is stuck with a cached Prisma Client, recreating the project will give you a completely fresh build with no cache.

## Step 1: Save Your Environment Variables

**IMPORTANT:** Before deleting, save all your environment variables!

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. **Write down or copy** all the values:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `NEXT_PUBLIC_APP_URL`
   - `POSTGRES_URL` (if you have it)
   - `PRISMA_DATABASE_URL` (if you have it)
   - Any other variables you have

## Step 2: Delete the Old Project

1. Go to Vercel Dashboard → Your Project
2. Click **Settings** → **General**
3. Scroll to the bottom
4. Find **"Delete Project"** section
5. Type the project name to confirm: `honorable-ai`
6. Click **"Delete"**
7. Confirm deletion

## Step 3: Create New Project

1. Go to Vercel Dashboard
2. Click **"Add New..."** → **"Project"**
3. Find your repository: `beltranalain/Honorable.AI`
4. Click **"Import"**

## Step 4: Configure New Project

### Framework Settings:
- **Framework Preset:** Next.js (should auto-detect)
- **Root Directory:** `.` (leave as default)
- **Build Command:** `npm run build` (should be default)
- **Output Directory:** `.next` (should be default)
- **Install Command:** `npm install` (should be default)

### Environment Variables:
Click **"Environment Variables"** and add:

1. **DATABASE_URL:**
   - Value: Your PostgreSQL connection string
   - Should start with: `postgres://` or `postgresql://`
   - Select: Production, Preview, Development

2. **AUTH_SECRET:**
   - Value: `344e11ac0b8d530be37625647772982874d10989a3d640452c9f16ac5125b837` (the one you generated earlier)
   - Select: Production, Preview, Development

3. **NEXT_PUBLIC_APP_URL:**
   - Value: `https://honorable-ai.com`
   - Select: Production, Preview, Development

4. **DIRECT_URL** (if you have it):
   - Value: Your direct PostgreSQL connection string
   - Select: Production, Preview, Development

5. **POSTGRES_URL** (if you have it):
   - Value: Your PostgreSQL connection string
   - Select: Production, Preview, Development

6. **PRISMA_DATABASE_URL** (if you have it):
   - Value: Your Prisma connection string
   - Select: Production, Preview, Development

### Domain:
1. Click **"Domains"** tab
2. Add: `honorable-ai.com`
3. Follow the DNS instructions (if needed)

## Step 5: Deploy

1. Click **"Deploy"**
2. Watch the build logs - you should see:
   ```
   ✅ Schema is configured for PostgreSQL
   ✅ Schema file verified: PostgreSQL provider detected
   🧹 Cleaning build artifacts and caches...
   ✅ Cleaned Prisma cache
   🔄 Force regenerating Prisma Client for PostgreSQL...
   ✅ Prisma Client regenerated successfully!
   ```

## Step 6: Test

After deployment completes:
1. Visit: `https://honorable-ai.com/api/test-db`
   - Should show: `"status": "connected"` ✅
2. Try signup: `https://honorable-ai.com/signup`
   - Should work without 500 error ✅

---

## Why This Works

- **No cache:** Fresh project = no cached Prisma Client
- **Fresh build:** All scripts run from scratch
- **Clean slate:** No old build artifacts

This should fix the SQLite error completely!


