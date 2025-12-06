# Troubleshoot: Variables in Vercel But Still Not Working

## ✅ Variables Are Set - Now What?

If your environment variables are already in Vercel but you're still getting database connection errors, check these:

---

## 🔍 Step 1: Verify Production Environment is Enabled

**This is the #1 cause of issues!**

1. Go to Vercel Dashboard → Settings → Environment Variables
2. For **each variable** (`DATABASE_URL` and `DIRECT_URL`):
   - Click on the variable name
   - Look at the "Environment" section
   - **Make sure "Production" has a checkmark ✅**
   - If not, click Edit → Check "Production" → Save

**Common Issue:** Variables might be set for "Preview" or "Development" but NOT "Production"

---

## 🔍 Step 2: Check If Variables Are Actually Being Used

1. Visit: `https://your-app.vercel.app/api/test-db`
2. Look at the response:

**If you see:**
```json
{
  "hasDatabaseUrl": false,
  "hasDirectUrl": false
}
```
→ Variables are NOT being read (go to Step 3)

**If you see:**
```json
{
  "hasDatabaseUrl": true,
  "hasDirectUrl": true,
  "success": false,
  "error": "Can't reach database server..."
}
```
→ Variables ARE being read, but database is unreachable (go to Step 4)

---

## 🔍 Step 3: Redeploy After Setting Variables

**Environment variables only work after redeploy!**

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **"..."** (three dots)
4. Click **"Redeploy"**
5. **IMPORTANT:** Uncheck "Use existing Build Cache" if available
6. Click **"Redeploy"**
7. Wait 2-3 minutes for it to finish

**Try again after redeploy completes.**

---

## 🔍 Step 4: Check Database Status

If variables are being read but connection fails:

### Check Prisma Console:
1. Go to: https://console.prisma.io
2. Find your database
3. Check if it shows:
   - ✅ **Active** (good)
   - ⏸️ **Paused** (click "Resume")
   - ❌ **Error** (contact support)

### Check Database Credentials:
1. In Prisma Console, go to your database
2. Check if credentials are still valid
3. If expired, regenerate them
4. Update `DATABASE_URL` and `DIRECT_URL` in Vercel with new credentials

---

## 🔍 Step 5: Verify Variable Values Are Correct

1. In Vercel → Settings → Environment Variables
2. Click on `DATABASE_URL`
3. Make sure the value shows:
   ```
   postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require
   ```
4. Check for:
   - ✅ Starts with `postgres://`
   - ✅ Has `@db.prisma.io:5432`
   - ✅ Ends with `?sslmode=require`
   - ❌ No extra spaces or line breaks
   - ❌ No quotes around the value

---

## 🔍 Step 6: Check Deployment Logs

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **"View Function Logs"** or **"Logs"**
4. Look for errors like:
   - "DATABASE_URL is not set"
   - "Can't reach database server"
   - Connection timeout errors

---

## 🔍 Step 7: Test Database Connection Directly

If you have access to the database, test the connection string:

```bash
# Test if database is reachable
psql "postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require"
```

If this fails, the database itself might be unreachable.

---

## 🎯 Most Common Issues (In Order)

1. **Variables not enabled for Production** ← Check this first!
2. **Didn't redeploy after setting variables** ← Check this second!
3. **Database is paused** ← Check Prisma Console
4. **Credentials expired** ← Regenerate in Prisma Console
5. **Network/firewall blocking** ← Less common, check Prisma support

---

## ✅ Quick Diagnostic Checklist

Run through this checklist:

- [ ] Variables are in Vercel ✅ (you confirmed this)
- [ ] `DATABASE_URL` has "Production" checked ✅
- [ ] `DIRECT_URL` has "Production" checked ✅
- [ ] Redeployed after setting variables
- [ ] Tested `/api/test-db` endpoint
- [ ] Checked Prisma Console - database is active
- [ ] Checked deployment logs for errors

---

## 🆘 Still Not Working?

If you've checked everything above:

1. **Share the response from `/api/test-db`** - This will tell us exactly what's wrong
2. **Check Prisma Console** - Is database active?
3. **Check Vercel deployment logs** - Any errors during build/runtime?

The `/api/test-db` endpoint will give us the exact information we need to diagnose the issue.

