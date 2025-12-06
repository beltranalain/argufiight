# How to Find Vercel Postgres (Not in Marketplace)

## Important: Vercel Postgres is NOT in the Marketplace

The "Marketplace Database Providers" modal shows **third-party** databases (Neon, Supabase, Prisma Postgres, etc.). 

**Vercel Postgres** is a **native Vercel storage** option, accessed differently.

## Correct Way to Access Vercel Postgres

### Step 1: Cancel the Marketplace Modal
- Click **Cancel** on the "Marketplace Database Providers" modal
- This will close the third-party database options

### Step 2: Go to Storage Tab
1. In your Vercel dashboard, look at the **top navigation bar**
2. Click **Storage** (should be visible in the nav bar)
3. You should see the Storage page with:
   - Title: "Storage"
   - Description: "Read and write directly to databases and stores from your projects"
   - A **"Create Database"** button (usually on the right side)

### Step 3: Click "Create Database"
- Click the **"Create Database"** button
- You should see options like:
  - **Postgres** ← This is Vercel Postgres!
  - **Kv** (Key-Value store)
  - **Blob** (for file storage)

### Step 4: Select Postgres
- Click **Postgres**
- This will create a **Vercel Postgres** database (not a third-party one)

## Visual Guide

**Wrong Path:**
```
Dashboard → Integrations/Marketplace → Marketplace Database Providers
❌ This shows third-party databases only
```

**Correct Path:**
```
Dashboard → Storage Tab → Create Database → Postgres
✅ This creates native Vercel Postgres
```

## If You Don't See "Storage" Tab

If you don't see the Storage tab in the navigation:

1. **Check your Vercel plan:**
   - Storage is available on Hobby (Free) and Pro plans
   - Make sure you're on a plan that includes Storage

2. **Try direct URL:**
   - Go to: `https://vercel.com/dashboard/[your-team]/storage`
   - Replace `[your-team]` with your team/project name

3. **Check project settings:**
   - Make sure you're viewing the correct project
   - Storage is project-specific

## Alternative: Check Your Current Storage

If you're already on the Storage page:

1. Look for existing databases listed
2. You might see:
   - "prisma-post Database" (your old Prisma database)
   - "argufight-blob Blob Store" (your blob storage)
3. Click **"Create Database"** button to add Vercel Postgres

## What You Should See

After clicking "Create Database" → "Postgres", you should see:
- A form to configure the database
- Plan selection (Hobby/Pro)
- Region selection
- **NOT** a marketplace of third-party providers

## Still Can't Find It?

If you still can't find Vercel Postgres:

1. **Screenshot your Storage page** - I can help identify where to click
2. **Check Vercel documentation:**
   - https://vercel.com/docs/storage/vercel-postgres
3. **Verify your Vercel plan** includes Storage feature

## Quick Checklist

- [ ] Canceled marketplace modal
- [ ] On Storage tab (not Integrations/Marketplace)
- [ ] See "Create Database" button
- [ ] Clicked "Create Database"
- [ ] See "Postgres" option (this is Vercel Postgres!)

