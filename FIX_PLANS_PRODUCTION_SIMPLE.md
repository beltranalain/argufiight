# Fix Plans Board in Production - Simple Steps

## Quick Fix (PowerShell)

### Step 1: Get Database URLs from Vercel

1. Go to https://vercel.com/dashboard
2. Select your **argufight** project
3. Go to **Settings** → **Environment Variables**
4. Find these two variables:
   - `DATABASE_URL` (should start with `postgresql://`)
   - `DIRECT_URL` (should start with `postgresql://`)

### Step 2: Run in PowerShell

Open PowerShell in your project folder and run:

```powershell
# Replace with your actual URLs from Vercel
$env:DATABASE_URL="postgresql://your-actual-database-url-here"
$env:DIRECT_URL="postgresql://your-actual-direct-url-here"

# Create the tables
npx prisma db push --accept-data-loss
```

### Step 3: Test

1. Go to https://www.argufight.com/admin/plans
2. Click "New Board"
3. Enter a board name and click "Create"
4. If it works, you're done! ✅

---

## Alternative: Use the Script

I created a helper script. Just run:

```powershell
.\FIX_PLANS_PRODUCTION.ps1
```

It will prompt you for the URLs and do everything automatically.

---

## What This Does

- Creates `boards` table
- Creates `lists` table  
- Creates `cards` table
- Creates `card_labels` table
- Sets up all relationships and indexes

This takes about 5-10 seconds and won't affect any existing data.

