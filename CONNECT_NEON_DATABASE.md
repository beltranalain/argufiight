# Connect Neon Database to Vercel Project

## Current Situation

You see `NEON_POSTGRES_URL` in Storage with a **"Connect"** button. This means:
- ✅ Neon database exists
- ❌ Not fully connected to your project
- ⚠️ Environment variables might not be set automatically

## Should You Connect?

**YES!** Click "Connect" to:
- ✅ Properly link Neon to your project
- ✅ Automatically set environment variables
- ✅ Ensure Vercel uses the correct database

## How to Connect

### Step 1: Click Connect

1. In Vercel Storage tab, find **NEON_POSTGRES_URL**
2. Click the **"Connect"** button
3. A modal will appear: "Configure argufight"

### Step 2: Configure Connection

In the modal:

1. **Environments:**
   - Check ✅ **Production**
   - Check ✅ **Preview**
   - Check ✅ **Development**

2. **Custom Prefix:**
   - **IMPORTANT:** Change from `NEON_POSTGRES` to `DATABASE`
   - This will create `DATABASE_URL` instead of `NEON_POSTGRES_URL`
   - Your code expects `DATABASE_URL`, so this is important!

3. Click **Connect**

### Step 3: Handle DIRECT_URL

After connecting, you'll have `DATABASE_URL` set automatically, but you still need `DIRECT_URL`:

1. Go to **Settings** → **Environment Variables**
2. Find `DATABASE_URL` (should be set automatically)
3. **Create `DIRECT_URL`:**
   - Click **Add New**
   - **Key:** `DIRECT_URL`
   - **Value:** Same as `DATABASE_URL` but remove `-pooler` from the hostname
   - Example: If `DATABASE_URL` is:
     ```
     postgresql://...@ep-long-math-a4am11rd-pooler.us-east-1.aws.neon.tech/...
     ```
     Then `DIRECT_URL` should be:
     ```
     postgresql://...@ep-long-math-a4am11rd.us-east-1.aws.neon.tech/...
     ```
   - **Environments:** Production ✅, Preview ✅, Development ✅
   - Click **Save**

### Step 4: Verify Environment Variables

After connecting, check:

1. **DATABASE_URL** should exist (set automatically)
   - Should point to Neon with `-pooler`
   - Should be enabled for Production ✅

2. **DIRECT_URL** should exist (you created it)
   - Should point to Neon without `-pooler`
   - Should be enabled for Production ✅

### Step 5: Redeploy

**CRITICAL:** After connecting and setting variables:

1. Go to **Deployments** tab
2. Click **...** on latest deployment
3. Click **Redeploy**
4. Wait ~2-3 minutes

### Step 6: Test

After redeploy:

1. Test connection: `https://your-app.vercel.app/api/test-db`
   - Should show `success: true`

2. Check admin dashboard:
   - `/admin/categories` - Should show 6 categories
   - `/admin/judges` - Should show 7 judges

## Alternative: Keep Manual Setup

If you prefer to keep the manual environment variables:

1. **Don't click Connect** (keep it as is)
2. **Verify** your manual `DATABASE_URL` and `DIRECT_URL` are correct
3. **Make sure** they're enabled for Production
4. **Redeploy** to ensure they're used

## Recommendation

**Click Connect** - It ensures everything is properly linked and Vercel manages the connection correctly. Just remember to:
- Use custom prefix `DATABASE` (not `NEON_POSTGRES`)
- Create `DIRECT_URL` manually after connecting
- Redeploy after connecting

## Troubleshooting

**"Environment variable conflict"**
- If you see an error about existing `DATABASE_URL`:
  - Delete the old `DATABASE_URL` first
  - Then click Connect
  - Or use a different prefix temporarily

**"Still not working after connect"**
- Verify `DIRECT_URL` is set (not just `DATABASE_URL`)
- Check both are enabled for Production
- Redeploy after connecting

