# Enable Belt System in Vercel Production

## Problem
You're seeing the error: **"Belt system is not enabled"** in production because the `ENABLE_BELT_SYSTEM` environment variable is not set.

## Solution: Add Environment Variable to Vercel

### Option 1: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Navigate to: https://vercel.com/dashboard
   - Select your project: `argufight`

2. **Open Environment Variables**
   - Click **Settings** → **Environment Variables**

3. **Add New Variable**
   - Click **"Add New"** button
   - **Key:** `ENABLE_BELT_SYSTEM`
   - **Value:** `true`
   - **Environments:** ✅ Check **Production**, ✅ **Preview**, ✅ **Development**
   - Click **"Save"**

4. **Redeploy**
   - Go to **Deployments** tab
   - Click **"..."** on the latest deployment
   - Click **"Redeploy"**
   - Wait for deployment to complete

### Option 2: Via Vercel CLI

Run this command in PowerShell:

```powershell
echo "true" | vercel env add ENABLE_BELT_SYSTEM production
echo "true" | vercel env add ENABLE_BELT_SYSTEM preview
echo "true" | vercel env add ENABLE_BELT_SYSTEM development
```

Then redeploy:
```powershell
vercel --prod
```

## Verify It's Working

After redeploying, check:

1. **Visit:** https://www.argufight.com/admin/belts
2. **Should see:** Belt Management page (not the error)
3. **Check browser console:** No "Belt system is not enabled" errors

## What This Does

Setting `ENABLE_BELT_SYSTEM=true` enables:
- ✅ Belt creation and management
- ✅ Belt challenges
- ✅ Belt room UI
- ✅ Admin belt management
- ✅ All belt-related API endpoints

## Important Notes

- **This is a feature flag** - The belt system code is already deployed, it just needs to be enabled
- **No code changes needed** - Just add the environment variable
- **Belts in database** - If you created belts locally, they should appear once this is enabled (if using the same database)
- **Database** - Make sure production is using the same database where belts exist, or create new belts via admin panel

## Next Steps After Enabling

1. **Check if belts exist in production database:**
   - Visit `/admin/belts` - should show existing belts if any
   - If no belts, create them via the admin panel

2. **Create test belts (if needed):**
   - Go to `/admin/belts`
   - Click "Create Belt"
   - Fill in the form and create a belt

3. **Verify user-facing pages:**
   - Visit `/belts/room` - should show belt room
   - Visit `/belts/[id]` - should show belt details
