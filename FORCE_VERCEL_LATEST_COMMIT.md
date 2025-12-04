# Force Vercel to Deploy Latest Commit

## Problem
Vercel keeps deploying old commit `d25431a` instead of latest commits (`aba65f9e` or newer).

## Solution: Disconnect and Reconnect Git Integration

### Step 1: Disconnect Git Integration

1. Go to **Vercel Dashboard** → Your Project (`honorable-ai`)
2. Click **Settings** (top navigation)
3. Click **Git** (left sidebar)
4. Scroll down to find the connected repository
5. Click **"Disconnect"** button
6. Confirm the disconnection

### Step 2: Reconnect Git Integration

1. After disconnecting, you'll see a **"Connect Git Repository"** button
2. Click it
3. Select **GitHub** (if prompted)
4. Authorize Vercel to access your GitHub (if needed)
5. Select repository: **`beltranalain/Honorable.AI`**
6. Select branch: **`main`**
7. Click **"Connect"**

### Step 3: Verify Deployment

After reconnecting:
1. Vercel should automatically start a new deployment
2. Go to **Deployments** tab
3. Check the build logs - you should see:
   - `Commit: aba65f9e` (or latest)
   - `Next.js version: 15.1.0` (not 16.0.6)
   - `🔄 Force regenerating Prisma Client for PostgreSQL...`

### Step 4: Verify Webhook Created

1. Go to **GitHub** → Your Repo → **Settings** → **Webhooks**
2. You should now see a Vercel webhook
3. Future commits will automatically trigger deployments

## Alternative: Use Vercel CLI (If Dashboard Doesn't Work)

If the dashboard method doesn't work, use Vercel CLI:

```powershell
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to project directory
cd C:\Users\beltr\Honorable.AI

# Deploy from current directory (will use latest commit)
vercel --prod --force
```

This will deploy directly from your local repository, which has the latest commits.

## What Should Happen

After reconnecting:
- ✅ Latest commit (`aba65f9e`) is deployed
- ✅ Next.js updated to `15.1.0` (security fix)
- ✅ Prisma regeneration script runs
- ✅ Database connection works (no more "Error code 14")
- ✅ Webhook created for future auto-deployments

