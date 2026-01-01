# Website Not Loading - Troubleshooting Guide

**Date:** December 14, 2025

---

## ✅ Quick Checks

### 1. Check Deployment Status
1. Go to Vercel Dashboard → Deployments
2. Check if the latest deployment is **Ready** (green) or **Error** (red)
3. If Error, click on it to see the error message

### 2. Check Environment Variables
Based on your Vercel dashboard, you have:
- ✅ `DATABASE_URL` - Set
- ✅ `DIRECT_URL` - Set
- ✅ `AUTH_SECRET` - Set
- ✅ `BLOB_READ_WRITE_TOKEN` - Set
- ✅ `DEEPSEEK_API_KEY` - Set
- ✅ `CRON_SECRET` - Set

### 3. Missing Environment Variable (Likely Issue)
**⚠️ `NEXT_PUBLIC_APP_URL` might be missing!**

This is used for:
- Generating absolute URLs
- API redirects
- Email links
- Social sharing

**Add this:**
- **Key:** `NEXT_PUBLIC_APP_URL`
- **Value:** `https://www.argufight.com` (or your actual domain)
- **Environment:** ✅ Production only

---

## 🔍 Common Issues

### Issue 1: Deployment Failed (Cron Jobs)
**Status:** ✅ FIXED - We reduced cron jobs to 2

**Check:**
- Go to Vercel Dashboard → Deployments
- Look for latest deployment
- If it shows "Error", check the build logs

### Issue 2: Database Connection
**Check:**
- Visit: `https://your-domain.vercel.app/api/test-db`
- Should return: `{ success: true, hasDatabaseUrl: true }`

**If it fails:**
- Verify `DATABASE_URL` is correct in Vercel
- Check Neon dashboard to ensure database is active

### Issue 3: Missing NEXT_PUBLIC_APP_URL
**Symptoms:**
- Site loads but links don't work
- API calls fail
- Redirects don't work

**Fix:**
- Add `NEXT_PUBLIC_APP_URL` to Vercel environment variables
- Value: Your production domain

### Issue 4: Build Cache Issues
**Fix:**
1. Go to Vercel Dashboard → Deployments
2. Click "..." on latest deployment
3. Click "Redeploy"
4. **Uncheck** "Use existing Build Cache"
5. Click "Redeploy"

---

## 🚀 Step-by-Step Fix

### Step 1: Check Deployment Status
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to **Deployments** tab
4. Check the latest deployment status

**If it shows "Error":**
- Click on the deployment
- Scroll to "Build Logs"
- Look for error messages
- Share the error with me

**If it shows "Ready":**
- Continue to Step 2

### Step 2: Add Missing Environment Variable
1. Go to **Settings** → **Environment Variables**
2. Click **"Add New"**
3. Add:
   - **Key:** `NEXT_PUBLIC_APP_URL`
   - **Value:** `https://www.argufight.com` (or your actual domain)
   - **Environment:** ✅ Production only
4. Click **Save**

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. **Uncheck** "Use existing Build Cache"
5. Click **"Redeploy"**
6. Wait for deployment to complete

### Step 4: Test the Site
1. Visit your domain: `https://www.argufight.com`
2. Check browser console (F12) for errors
3. Test key pages:
   - Homepage: `/`
   - Debates: `/debates`
   - Login: `/login`

---

## 🔧 Quick Diagnostic Commands

### Test Database Connection
```bash
curl https://your-domain.vercel.app/api/test-db
```

**Expected:** `{ success: true, hasDatabaseUrl: true }`

### Test Homepage API
```bash
curl https://your-domain.vercel.app/api/homepage/content
```

**Expected:** JSON with homepage sections

### Check Health Endpoint
```bash
curl https://your-domain.vercel.app/api/health
```

**Expected:** `{ status: "ok" }` or similar

---

## 📋 Checklist

- [ ] Latest deployment shows "Ready" (not "Error")
- [ ] `NEXT_PUBLIC_APP_URL` is set in Vercel
- [ ] All required environment variables are set
- [ ] Database connection works (`/api/test-db`)
- [ ] No errors in browser console (F12)
- [ ] Site loads at your domain

---

## 🆘 If Still Not Working

### Check These:

1. **Domain Configuration**
   - Is your domain correctly configured in Vercel?
   - DNS records pointing to Vercel?

2. **Browser Cache**
   - Try incognito/private mode
   - Clear browser cache
   - Try different browser

3. **Vercel Logs**
   - Go to Vercel Dashboard → Logs
   - Check for runtime errors
   - Look for 500 errors

4. **Database Status**
   - Check Neon dashboard
   - Ensure database is not paused
   - Verify connection string is correct

---

## 💡 Most Likely Issues

Based on your setup:

1. **Missing `NEXT_PUBLIC_APP_URL`** (80% likely)
   - Add it to Vercel environment variables

2. **Deployment not completed** (15% likely)
   - Check deployment status
   - Redeploy if needed

3. **Database connection issue** (5% likely)
   - Verify `DATABASE_URL` is correct
   - Check Neon dashboard

---

**Start with adding `NEXT_PUBLIC_APP_URL` and redeploying!** 🚀
