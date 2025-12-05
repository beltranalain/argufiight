# Fix Production Database Connection Error

## Current Error
```
Can't reach database server at `db.prisma.io:5432`
```

This means `DATABASE_URL` is not set correctly in Vercel.

## Quick Fix (5 minutes)

### Step 1: Get Your Database URL

You're using Prisma's hosted database. The connection string should be:
```
postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require
```

### Step 2: Set Environment Variables in Vercel

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Click on your project

2. **Navigate to Settings:**
   - Click **"Settings"** (top menu)
   - Click **"Environment Variables"** (left sidebar)

3. **Add/Update DATABASE_URL:**
   - If it exists, click the **edit icon** (pencil)
   - If it doesn't exist, click **"Add New"**
   - **Key:** `DATABASE_URL`
   - **Value:** 
     ```
     postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require
     ```
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
   - Click **"Save"**

4. **Add DIRECT_URL (if missing):**
   - Click **"Add New"**
   - **Key:** `DIRECT_URL`
   - **Value:** (same as DATABASE_URL)
     ```
     postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require
     ```
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
   - Click **"Save"**

5. **Verify AUTH_SECRET exists:**
   - If missing, generate one:
     ```powershell
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Add it as `AUTH_SECRET` with all environments selected

### Step 3: Redeploy

**IMPORTANT:** After setting environment variables, you MUST redeploy:

1. Go to **"Deployments"** tab
2. Find the latest deployment
3. Click the **"..."** (three dots) menu
4. Click **"Redeploy"**
5. Wait for deployment to complete

### Step 4: Verify

After redeploy:
1. Try logging in again
2. Check if the site loads
3. Check Vercel function logs (Deployments → Latest → Functions tab)

## If Still Not Working

### Check Database Status
1. Go to Prisma Dashboard: https://console.prisma.io
2. Check if your database is active
3. If paused, resume it

### Verify Environment Variables
1. In Vercel, go to Settings → Environment Variables
2. Make sure `DATABASE_URL` shows the correct value
3. Make sure it's selected for **Production** environment

### Check Vercel Logs
1. Go to Deployments → Latest deployment
2. Click "Functions" tab
3. Look for database connection errors
4. Check if `DATABASE_URL` is being read correctly

## Common Mistakes

❌ **Wrong:** Setting variables but not redeploying
✅ **Right:** Set variables → Redeploy

❌ **Wrong:** Only setting for Preview environment
✅ **Right:** Set for Production, Preview, AND Development

❌ **Wrong:** Using local `.env` file values
✅ **Right:** Use the actual Prisma database connection string

## Expected Result

After fixing:
- ✅ Login works
- ✅ `/api/auth/me` returns 200 (not 401)
- ✅ `/api/ticker` returns 200 (not 500)
- ✅ Site loads without database errors

