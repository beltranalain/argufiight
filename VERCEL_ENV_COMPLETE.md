# Complete Vercel Environment Variables Setup

## Current Status
You have most variables, but you're missing `DIRECT_URL` which is required for Prisma migrations.

## Required Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

### 1. DATABASE_URL ✅ (You have this)
```
postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require
```
- **Key:** `DATABASE_URL`
- **Environments:** Production, Preview, Development

### 2. DIRECT_URL ❌ (MISSING - Add this!)
```
postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require
```
- **Key:** `DIRECT_URL`
- **Value:** Same as DATABASE_URL (without pooling)
- **Environments:** Production, Preview, Development
- **Why:** Needed for Prisma migrations

### 3. AUTH_SECRET ✅ (You have this)
```
344e11ac0b8d530be37625647772982874d10989a3d640452c9f16ac5125b837
```
- **Key:** `AUTH_SECRET`
- **Environments:** Production, Preview, Development

### 4. Optional: PRISMA_DATABASE_URL (You have this, but not used)
You have Prisma Accelerate configured, but your schema uses `DATABASE_URL` directly. You can either:
- **Option A:** Keep using `DATABASE_URL` (current setup) - Remove `PRISMA_DATABASE_URL`
- **Option B:** Switch to Prisma Accelerate - Update schema to use `PRISMA_DATABASE_URL`

For now, **Option A is simpler**. The `PRISMA_DATABASE_URL` won't hurt, but it's not being used.

### 5. BLOB_READ_WRITE_TOKEN ✅ (You have this)
```
vercel_blob_rw_dvwKczTLQ7v3F9UK_M1OR2yN9wAy6BAAXumTPpo6S09kKxA
```
- **Key:** `BLOB_READ_WRITE_TOKEN`
- **Environments:** Production, Preview, Development

### 6. DEEPSEEK_API_KEY ✅ (You have this)
```
sk-2b74f7dbee0e429f87a56f167de005c1
```
- **Key:** `DEEPSEEK_API_KEY`
- **Environments:** Production, Preview, Development

### 7. NEXT_PUBLIC_APP_URL (Check if you have this)
```
https://your-app-name.vercel.app
```
- **Key:** `NEXT_PUBLIC_APP_URL`
- **Value:** Your actual Vercel domain
- **Environments:** Production, Preview, Development

## Action Items

### Step 1: Add DIRECT_URL
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Click **"Add New"**
3. **Key:** `DIRECT_URL`
4. **Value:** `postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require`
5. **Environments:** ✅ Production, ✅ Preview, ✅ Development
6. Click **"Save"**

### Step 2: Verify All Variables Are Set for Production
1. In Environment Variables page, check each variable
2. Make sure **Production** checkbox is checked for ALL variables
3. If any are missing Production, edit and check it

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait for completion

### Step 4: Verify After Deploy
1. Try logging in
2. Check Vercel function logs for errors
3. Verify site loads correctly

## Why DIRECT_URL is Needed

Your Prisma schema has:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // For queries (with pooling)
  directUrl = env("DIRECT_URL")        // For migrations (direct connection)
}
```

- `DATABASE_URL` is used for regular queries (can use connection pooling)
- `DIRECT_URL` is used for migrations (needs direct connection, no pooling)

Without `DIRECT_URL`, Prisma can't run migrations, which might cause connection issues.

## Summary

**Missing:** `DIRECT_URL`  
**Action:** Add it with the same value as `DATABASE_URL`  
**Then:** Redeploy

After adding `DIRECT_URL` and redeploying, your database connection should work!

