# Database Unavailable - Fix Guide

## ⚠️ Current Issue

Your Neon database is **unavailable** (paused or quota exceeded). This is causing:
1. **Homepage showing fallback content** instead of your actual homepage
2. **Login failing** with 500 errors
3. **All database queries failing**

## ✅ What I Fixed

### 1. **Login Endpoint** (`app/api/auth/login/route.ts`)
- ✅ Added error handling to `prisma.user.findUnique()` query
- ✅ Added error handling to `prisma.advertiser.findUnique()` queries
- ✅ Returns 503 (Service Unavailable) instead of 500 when database is down
- ✅ Shows user-friendly error message

### 2. **Homepage Fallback**
- The homepage is showing fallback content because the database is unavailable
- This is **working as intended** - it prevents a blank page
- Once the database is available, your actual homepage content will show

---

## 🔧 How to Fix the Database Issue

### Step 1: Check Neon Dashboard
1. Go to [console.neon.tech](https://console.neon.tech)
2. Sign in to your account
3. Select your project

### Step 2: Check Database Status
Look for:
- **"Paused"** status → Click "Resume" button
- **"Quota Exceeded"** → Wait for quota reset (usually monthly) or upgrade

### Step 3: Resume Database (if paused)
1. Click on your database
2. Look for "Resume" or "Start" button
3. Click it to resume the database
4. Wait 1-2 minutes for it to start

### Step 4: Verify Connection
After resuming:
1. Check Vercel logs - should see successful connections
2. Visit your homepage - should show actual content
3. Try logging in - should work now

---

## 📊 What Happens Now

### While Database is Unavailable:
- ✅ Homepage shows fallback content (not blank)
- ✅ Login returns 503 with helpful message (not 500 crash)
- ✅ `/api/auth/me` returns 401 gracefully
- ✅ Site remains functional (just can't authenticate)

### Once Database is Available:
- ✅ Homepage shows your actual content
- ✅ Login works normally
- ✅ All features work as expected

---

## 🎯 Next Steps

1. **Check Neon Dashboard** - Is database paused?
2. **Resume if paused** - Click "Resume" button
3. **Wait 1-2 minutes** - Database needs time to start
4. **Test homepage** - Should show your actual content
5. **Test login** - Should work now

---

## ⚠️ Important Notes

- **The fallback homepage is intentional** - it prevents blank pages when database is down
- **Once database is available, your actual homepage will show automatically**
- **No code changes needed** - just resume the database in Neon

---

## 🔍 If Database is Not Paused

If the database shows as "Active" but still not working:

1. **Check quota usage:**
   - Go to Neon dashboard → Usage
   - See if compute time quota is exceeded
   - Wait for monthly reset or upgrade plan

2. **Check connection string:**
   - Verify `DATABASE_URL` in Vercel environment variables
   - Make sure it matches Neon dashboard

3. **Try restarting database:**
   - Pause database
   - Wait 30 seconds
   - Resume database
   - Wait 1-2 minutes

---

## ✅ Summary

- **Fixed:** Login endpoint error handling
- **Fixed:** Advertiser check error handling  
- **Working:** Homepage fallback (shows content when DB down)
- **Action Needed:** Resume database in Neon dashboard

Once you resume the database, everything will work normally! 🚀
