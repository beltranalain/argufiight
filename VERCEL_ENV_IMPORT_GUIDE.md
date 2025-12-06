# Import Environment Variables to Vercel

## Quick Import Guide

You have an `Import.env.txt` file with all your environment variables. Here's how to import them to Vercel:

## Method 1: Using PowerShell Script (Recommended)

1. **Make sure you're logged in to Vercel CLI:**
   ```powershell
   vercel login
   ```

2. **Run the import script:**
   ```powershell
   .\import-vercel-env.ps1
   ```

3. **Follow the prompts:**
   - Select which environment(s) to set (Production, Preview, Development, or All)
   - Confirm to proceed

4. **Verify in Vercel Dashboard:**
   - Go to Settings → Environment Variables
   - Make sure all variables are there
   - **Critical:** Ensure `DATABASE_URL` and `DIRECT_URL` are enabled for **Production**

5. **Redeploy:**
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Select "Redeploy"

## Method 2: Manual Import via Vercel Dashboard

1. **Go to Vercel Dashboard:**
   - Navigate to your project
   - Go to **Settings** → **Environment Variables**

2. **Add each variable from `Import.env.txt`:**

   **AUTH_SECRET**
   - Key: `AUTH_SECRET`
   - Value: `344e11ac0b8d530be37625647772982874d10989a3d640452c9f16ac5125b837`
   - Environment: ✅ Production, ✅ Preview, ✅ Development

   **DATABASE_URL** (CRITICAL!)
   - Key: `DATABASE_URL`
   - Value: `postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require`
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - **Make sure Production is checked!**

   **DIRECT_URL** (CRITICAL!)
   - Key: `DIRECT_URL`
   - Value: `postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require`
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - **Make sure Production is checked!**

   **BLOB_READ_WRITE_TOKEN**
   - Key: `BLOB_READ_WRITE_TOKEN`
   - Value: `vercel_blob_rw_dvwKczTLQ7v3F9UK_M1OR2yN9wAy6BAAXumTPpo6S09kKxA`
   - Environment: ✅ Production, ✅ Preview, ✅ Development

   **DEEPSEEK_API_KEY**
   - Key: `DEEPSEEK_API_KEY`
   - Value: `sk-2b74f7dbee0e429f87a56f167de005c1`
   - Environment: ✅ Production, ✅ Preview, ✅ Development

   **PRISMA_DATABASE_URL** (Optional - for Prisma Accelerate)
   - Key: `PRISMA_DATABASE_URL`
   - Value: `prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19hRlB3LXdQRkd6eGVqSXBIMnFxNFQiLCJhcGlfa2V5IjoiMDFLQks0TVMxRkszVFJSU1BQRjA4NUdWWDAiLCJ0ZW5hbnRfaWQiOiJkMDY4NWNjZjU5NDQ2ZjRjZGYyYjFhY2Y2MDE2ZWQwNDVhZmUzMjUxNjUxZWYyZjY4ZDQxZmQ3YTcyZDViYzU2IiwiaW50ZXJuYWxfc2VjcmV0IjoiYjM2NGY3NjItY2UwNC00OWFkLWFkNGItMjlhYjQ2MzRlMTBkIn0.FNY4AV-LCX_6EdS9268EQ8x_oQDxr9t0uuspm8oHYL8`
   - Environment: ✅ Production, ✅ Preview, ✅ Development

3. **After adding all variables:**
   - Click **Save** for each one
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment
   - Select **"Redeploy"**

## Method 3: Using Vercel CLI (One by One)

If you prefer to add them one by one via CLI:

```powershell
# Make sure you're logged in
vercel login

# Add each variable (replace ENV with production, preview, or development)
echo "344e11ac0b8d530be37625647772982874d10989a3d640452c9f16ac5125b837" | vercel env add AUTH_SECRET production
echo "postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require" | vercel env add DATABASE_URL production
echo "postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require" | vercel env add DIRECT_URL production
echo "vercel_blob_rw_dvwKczTLQ7v3F9UK_M1OR2yN9wAy6BAAXumTPpo6S09kKxA" | vercel env add BLOB_READ_WRITE_TOKEN production
echo "sk-2b74f7dbee0e429f87a56f167de005c1" | vercel env add DEEPSEEK_API_KEY production
```

**Repeat for `preview` and `development` if needed.**

## Critical Variables for Database Connection

The database connection errors you're seeing are because these two variables must be set:

1. **`DATABASE_URL`** - Used for regular database queries
2. **`DIRECT_URL`** - Used for migrations (same value as DATABASE_URL)

**Both must be enabled for the Production environment!**

## Verification

After importing and redeploying:

1. **Test the connection:**
   ```
   https://your-app.vercel.app/api/test-db
   ```

2. **Check the response:**
   - `hasDatabaseUrl: true`
   - `hasDirectUrl: true`
   - `success: true` (if database is reachable)

## Troubleshooting

If you still get database connection errors after importing:

1. **Verify in Vercel Dashboard:**
   - Settings → Environment Variables
   - Make sure `DATABASE_URL` shows "Production" ✅
   - Make sure `DIRECT_URL` shows "Production" ✅

2. **Check if variables are actually set:**
   - Visit `/api/test-db` endpoint
   - It will show which variables are set

3. **Redeploy after changes:**
   - Environment variable changes require a redeploy
   - Go to Deployments → Latest → "..." → Redeploy

4. **Check database credentials:**
   - Verify the database is active in Prisma dashboard
   - Credentials might have expired (regenerate if needed)

