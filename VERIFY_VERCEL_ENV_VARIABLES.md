# Verify Vercel Environment Variables

## Problem
Data exists in Neon database, but production site shows empty. This means Vercel is still using the old database connection.

## Solution: Verify and Update Vercel Environment Variables

### Step 1: Check Current Vercel Environment Variables

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Check these variables:

**DATABASE_URL** should be:
```
postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**DIRECT_URL** should be:
```
postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Step 2: Verify Environment Scope

**CRITICAL:** Make sure both variables are enabled for **Production**:

1. For each variable (`DATABASE_URL` and `DIRECT_URL`):
   - Check the **Environment** column
   - Make sure **Production** ✅ is checked
   - If not, click **Edit** → Check **Production** → **Save**

### Step 3: Update if Wrong

If the variables are still pointing to the old Prisma database:

1. **Update DATABASE_URL:**
   - Click **Edit** on `DATABASE_URL`
   - **Value:** 
     ```
     postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
     ```
   - **Environments:** Production ✅, Preview ✅, Development ✅
   - Click **Save**

2. **Update DIRECT_URL:**
   - Click **Edit** on `DIRECT_URL` (or create if missing)
   - **Value:**
     ```
     postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd.us-east-1.aws.neon.tech/neondb?sslmode=require
     ```
   - **Environments:** Production ✅, Preview ✅, Development ✅
   - Click **Save**

### Step 4: Redeploy Production

**IMPORTANT:** After updating environment variables, you MUST redeploy:

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **...** (three dots) → **Redeploy**
4. **OR** push a new commit to trigger deployment
5. Wait for deployment to complete (~2-3 minutes)

### Step 5: Verify After Redeploy

After redeploy, test:

1. **Test database connection:**
   ```
   https://your-app.vercel.app/api/test-db
   ```
   Should show:
   ```json
   {
     "success": true,
     "userCount": 1,
     "hasDatabaseUrl": true
   }
   ```

2. **Check admin dashboard:**
   - Go to `/admin/categories` - Should show 6 categories
   - Go to `/admin/judges` - Should show 7 judges
   - Go to `/admin/content` - Should show homepage sections

## Common Issues

### "Still showing old data"
- Variables updated but not redeployed
- **Fix:** Redeploy after updating variables

### "Environment variables not found"
- Variables not set for Production environment
- **Fix:** Check Production ✅ is enabled

### "Can't connect to database"
- Wrong connection strings
- **Fix:** Verify connection strings match Neon exactly

## Quick Checklist

- [ ] DATABASE_URL points to Neon (with `-pooler`)
- [ ] DIRECT_URL points to Neon (without `-pooler`)
- [ ] Both variables enabled for **Production** ✅
- [ ] Redeployed after updating variables
- [ ] Tested `/api/test-db` - shows success
- [ ] Checked admin dashboard - shows data

## Still Not Working?

If data still doesn't show after redeploy:

1. **Check Vercel logs:**
   - Go to **Deployments** → Latest → **Logs**
   - Look for database connection errors

2. **Verify connection strings:**
   - Double-check they match Neon exactly
   - Make sure no extra spaces or characters

3. **Test locally:**
   - Set environment variables locally
   - Run `npm run dev`
   - Check if data shows locally

4. **Contact me** with:
   - Screenshot of Vercel environment variables
   - Output from `/api/test-db`
   - Any error messages from logs

