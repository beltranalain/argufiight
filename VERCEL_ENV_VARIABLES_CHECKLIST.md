# Vercel Environment Variables - Complete Checklist

## ⚠️ IMPORTANT: These Must Be Set in Vercel Dashboard

The `Import.env.txt` file is just a reference. You need to **manually add these to Vercel**.

## Step-by-Step: Add Variables to Vercel

### 1. Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Click on your project (argufight)
3. Go to **Settings** → **Environment Variables**

### 2. Add Each Variable Below

For each variable, click **"Add New"** and fill in:

---

## ✅ REQUIRED VARIABLES (Add These)

### 1. DATABASE_URL ⚠️ CRITICAL
- **Key:** `DATABASE_URL`
- **Value:** `postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require`
- **Environment:** ✅ Check **Production**, ✅ Check **Preview**, ✅ Check **Development**
- **Why:** This is your database connection string. Without it, the app can't connect to the database.

### 2. DIRECT_URL ⚠️ CRITICAL
- **Key:** `DIRECT_URL`
- **Value:** `postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require`
- **Environment:** ✅ Check **Production**, ✅ Check **Preview**, ✅ Check **Development**
- **Why:** Required for Prisma migrations. Same value as DATABASE_URL.

### 3. AUTH_SECRET
- **Key:** `AUTH_SECRET`
- **Value:** `344e11ac0b8d530be37625647772982874d10989a3d640452c9f16ac5125b837`
- **Environment:** ✅ Check **Production**, ✅ Check **Preview**, ✅ Check **Development**
- **Why:** Used for session encryption and authentication.

### 4. BLOB_READ_WRITE_TOKEN
- **Key:** `BLOB_READ_WRITE_TOKEN`
- **Value:** `vercel_blob_rw_dvwKczTLQ7v3F9UK_M1OR2yN9wAy6BAAXumTPpo6S09kKxA`
- **Environment:** ✅ Check **Production**, ✅ Check **Preview**, ✅ Check **Development**
- **Why:** For file uploads and image storage.

### 5. DEEPSEEK_API_KEY
- **Key:** `DEEPSEEK_API_KEY`
- **Value:** `sk-2b74f7dbee0e429f87a56f167de005c1`
- **Environment:** ✅ Check **Production**, ✅ Check **Preview**, ✅ Check **Development**
- **Why:** For AI-powered features (debate judgments, moderation, etc.).

---

## 🔵 OPTIONAL VARIABLES (Add If You Have Them)

### 6. PRISMA_DATABASE_URL (Optional - for Prisma Accelerate)
- **Key:** `PRISMA_DATABASE_URL`
- **Value:** `prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19hRlB3LXdQRkd6eGVqSXBIMnFxNFQiLCJhcGlfa2V5IjoiMDFLQks0TVMxRkszVFJSU1BQRjA4NUdWWDAiLCJ0ZW5hbnRfaWQiOiJkMDY4NWNjZjU5NDQ2ZjRjZGYyYjFhY2Y2MDE2ZWQwNDVhZmUzMjUxNjUxZWYyZjY4ZDQxZmQ3YTcyZDViYzU2IiwiaW50ZXJuYWxfc2VjcmV0IjoiYjM2NGY3NjItY2UwNC00OWFkLWFkNGItMjlhYjQ2MzRlMTBkIn0.FNY4AV-LCX_6EdS9268EQ8x_oQDxr9t0uuspm8oHYL8`
- **Environment:** ✅ Check **Production**, ✅ Check **Preview**, ✅ Check **Development**
- **Why:** For faster database queries (optional performance boost).

### 7. NEXT_PUBLIC_APP_URL (If you have a custom domain)
- **Key:** `NEXT_PUBLIC_APP_URL`
- **Value:** `https://your-domain.com` (replace with your actual domain)
- **Environment:** ✅ Check **Production**
- **Why:** For generating absolute URLs (emails, links, etc.).

---

## 📋 Quick Copy-Paste Checklist

After adding each variable in Vercel, check it off:

- [ ] DATABASE_URL (Production ✅)
- [ ] DIRECT_URL (Production ✅)
- [ ] AUTH_SECRET (Production ✅)
- [ ] BLOB_READ_WRITE_TOKEN (Production ✅)
- [ ] DEEPSEEK_API_KEY (Production ✅)
- [ ] PRISMA_DATABASE_URL (Production ✅) - Optional
- [ ] NEXT_PUBLIC_APP_URL (Production ✅) - Optional

---

## 🚨 CRITICAL: After Adding Variables

1. **Verify Production is checked** for DATABASE_URL and DIRECT_URL
2. **Redeploy your application:**
   - Go to **Deployments** tab
   - Click **"..."** (three dots) on the latest deployment
   - Click **"Redeploy"**
   - Wait for deployment to complete

3. **Test the connection:**
   - Visit: `https://your-app.vercel.app/api/test-db`
   - Should show: `success: true` and `hasDatabaseUrl: true`

---

## ❓ What If I Don't Have Some Values?

- **DATABASE_URL / DIRECT_URL:** You MUST have these. Get them from your Prisma dashboard.
- **AUTH_SECRET:** Generate a new one: `openssl rand -hex 32`
- **BLOB_READ_WRITE_TOKEN:** Get from Vercel Dashboard → Storage → Blob
- **DEEPSEEK_API_KEY:** Get from https://platform.deepseek.com/api_keys

---

## 🎯 Summary

**Minimum Required (5 variables):**
1. DATABASE_URL
2. DIRECT_URL
3. AUTH_SECRET
4. BLOB_READ_WRITE_TOKEN
5. DEEPSEEK_API_KEY

**All must be enabled for Production environment!**

