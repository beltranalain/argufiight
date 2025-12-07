# Check Vercel Webhook on GitHub

## Problem
Vercel is not automatically deploying new commits. The latest commit `ed51022` is on GitHub but Vercel hasn't deployed it.

## Solution: Verify GitHub Webhook

### Step 1: Check Webhook on GitHub

1. Go to your GitHub repository: https://github.com/beltranalain/Honorable.AI
2. Click **Settings** (top navigation)
3. Click **Webhooks** (left sidebar)
4. Look for a webhook from Vercel (should show `vercel.com` in the URL)
5. Check the webhook status:
   - ✅ **Green checkmark** = Working
   - ❌ **Red X** = Not working
   - ⚠️ **Yellow warning** = Needs attention

### Step 2: Test the Webhook

1. If the webhook exists, click on it
2. Scroll down to "Recent Deliveries"
3. Click on the most recent delivery
4. Check:
   - **Status**: Should be `200 OK`
   - **Request**: Should show the commit data
   - **Response**: Should show success

### Step 3: If No Webhook Exists

If there's no Vercel webhook:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Git**
2. Click **Disconnect** (if connected)
3. Click **Connect Git Repository**
4. Select `beltranalain/Honorable.AI`
5. Select branch `main`
6. This will create a new webhook

### Step 4: Manual Deployment (Quick Fix)

If webhook is broken and you need to deploy now:

1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Look for a **"Redeploy"** button or **"..."** menu
3. Click **"Redeploy"** on the latest deployment
4. **Uncheck** "Use existing Build Cache" (if option available)
5. This will force a fresh build with the latest code

## Alternative: Use Vercel CLI

If you have Vercel CLI installed:

```powershell
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login
vercel login

# Deploy from current directory
cd C:\Users\beltr\Honorable.AI
vercel --prod
```

This will deploy the latest commit directly.


