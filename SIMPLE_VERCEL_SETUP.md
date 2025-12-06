# Simple Vercel Environment Variables Setup

## 🎯 What You Need to Do

Your `Import.env.txt` file has all the values. You just need to **copy them into Vercel**.

---

## 📝 Step-by-Step Instructions

### Step 1: Open Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Click on your project
3. Click **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)

### Step 2: Add These 5 Variables

For each variable below, click **"Add New"** button and fill in:

---

#### Variable 1: DATABASE_URL ⚠️ MOST IMPORTANT
- **Name:** `DATABASE_URL`
- **Value:** Copy this entire line:
  ```
  postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require
  ```
- **Environments:** Check ✅ **Production**, ✅ **Preview**, ✅ **Development**
- Click **Save**

---

#### Variable 2: DIRECT_URL ⚠️ MOST IMPORTANT
- **Name:** `DIRECT_URL`
- **Value:** Copy this entire line (same as DATABASE_URL):
  ```
  postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require
  ```
- **Environments:** Check ✅ **Production**, ✅ **Preview**, ✅ **Development**
- Click **Save**

---

#### Variable 3: AUTH_SECRET
- **Name:** `AUTH_SECRET`
- **Value:** Copy this:
  ```
  344e11ac0b8d530be37625647772982874d10989a3d640452c9f16ac5125b837
  ```
- **Environments:** Check ✅ **Production**, ✅ **Preview**, ✅ **Development**
- Click **Save**

---

#### Variable 4: BLOB_READ_WRITE_TOKEN
- **Name:** `BLOB_READ_WRITE_TOKEN`
- **Value:** Copy this:
  ```
  vercel_blob_rw_dvwKczTLQ7v3F9UK_M1OR2yN9wAy6BAAXumTPpo6S09kKxA
  ```
- **Environments:** Check ✅ **Production**, ✅ **Preview**, ✅ **Development**
- Click **Save**

---

#### Variable 5: DEEPSEEK_API_KEY
- **Name:** `DEEPSEEK_API_KEY`
- **Value:** Copy this:
  ```
  sk-2b74f7dbee0e429f87a56f167de005c1
  ```
- **Environments:** Check ✅ **Production**, ✅ **Preview**, ✅ **Development**
- Click **Save**

---

### Step 3: Verify Production is Checked

**CRITICAL:** After adding each variable, make sure you see:
- ✅ Production
- ✅ Preview  
- ✅ Development

If you only see one or two checked, click on the variable → Edit → Check all three → Save

---

### Step 4: Redeploy

1. Go to **Deployments** tab (top menu)
2. Find the latest deployment
3. Click the **"..."** (three dots) button
4. Click **"Redeploy"**
5. Wait for it to finish (2-3 minutes)

---

### Step 5: Test

After redeploy finishes:
1. Visit: `https://your-app.vercel.app/api/test-db`
2. You should see:
   ```json
   {
     "success": true,
     "hasDatabaseUrl": true,
     "hasDirectUrl": true
   }
   ```

If you see `success: true`, you're done! ✅

---

## ❓ What If It Still Doesn't Work?

### Check 1: Are variables actually set?
- Go back to Settings → Environment Variables
- Make sure you see all 5 variables listed
- Make sure each one shows "Production" ✅

### Check 2: Did you redeploy?
- Environment variables only work after redeploy
- Go to Deployments → Latest → "..." → Redeploy

### Check 3: Is database active?
- Check Prisma Console: https://console.prisma.io
- Make sure database is not paused
- If paused, click "Resume"

---

## 📋 Quick Checklist

Before you finish, verify:
- [ ] Added DATABASE_URL (Production ✅)
- [ ] Added DIRECT_URL (Production ✅)
- [ ] Added AUTH_SECRET (Production ✅)
- [ ] Added BLOB_READ_WRITE_TOKEN (Production ✅)
- [ ] Added DEEPSEEK_API_KEY (Production ✅)
- [ ] Redeployed the application
- [ ] Tested `/api/test-db` endpoint

---

## 🎉 That's It!

Once all 5 variables are in Vercel and you've redeployed, your database connection should work!

