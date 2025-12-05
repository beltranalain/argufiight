# Database Connection Fix for Production

## Problem
The production site is showing:
```
Can't reach database server at `db.prisma.io:5432`
```

This means the `DATABASE_URL` environment variable is either:
1. Not set in Vercel
2. Set incorrectly
3. Using the wrong connection string format

## Solution

### Step 1: Check Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Verify you have these variables set:

#### Required Variables:
- **`DATABASE_URL`** - Should look like:
  ```
  postgres://default:password@ep-xxx-xxx.us-east-1.postgres.vercel-storage.com:5432/verceldb?sslmode=require&pgbouncer=true
  ```
  Note: The `pgbouncer=true` parameter is important for connection pooling.

- **`DIRECT_URL`** - Should look like:
  ```
  postgres://default:password@ep-xxx-xxx.us-east-1.postgres.vercel-storage.com:5432/verceldb?sslmode=require
  ```
  Note: This is the same URL but WITHOUT `pgbouncer=true` (used for migrations).

### Step 2: Get Your Database URLs from Vercel

1. In Vercel dashboard, go to **Storage** tab
2. Find your Postgres database
3. Click on it → Go to **.env.local** tab
4. Copy the `POSTGRES_URL` (this is your `DATABASE_URL`)
5. Copy the `POSTGRES_PRISMA_URL` (this is your `DIRECT_URL`)

### Step 3: Set Environment Variables in Vercel

1. Go to **Settings** → **Environment Variables**
2. Add/Update:

   **Variable Name:** `DATABASE_URL`
   **Value:** `postgres://...?pgbouncer=true` (from Storage tab)
   **Environment:** Production, Preview, Development (select all)

   **Variable Name:** `DIRECT_URL`
   **Value:** `postgres://...` (without pgbouncer, from Storage tab)
   **Environment:** Production, Preview, Development (select all)

### Step 4: Redeploy

After setting the environment variables:
1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Select **"Redeploy"**
4. Or push a new commit to trigger a new deployment

### Step 5: Verify Connection

After redeploy, check:
1. Try logging in again
2. Check Vercel function logs for any database errors
3. Verify the site loads correctly

## Alternative: Check Database Status

If the database is paused:
1. Go to **Storage** → Your Postgres database
2. Check if it shows "Paused" or "Sleeping"
3. If paused, click "Resume" to wake it up
4. Wait a few seconds, then try again

## Connection Pooling Notes

Vercel Postgres uses PgBouncer for connection pooling. This is why:
- `DATABASE_URL` should have `?pgbouncer=true` for regular queries
- `DIRECT_URL` should NOT have `pgbouncer=true` for migrations

The Prisma schema is already configured correctly:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // With pgbouncer
  directUrl = env("DIRECT_URL")        // Without pgbouncer
}
```

## Quick Test

To test if your connection works, you can temporarily add this to any API route:

```typescript
try {
  await prisma.$connect()
  console.log('✅ Database connected')
} catch (error) {
  console.error('❌ Database connection failed:', error)
}
```

## Common Issues

1. **Missing `pgbouncer=true`**: Add it to `DATABASE_URL`
2. **Wrong URL format**: Make sure it starts with `postgres://` or `postgresql://`
3. **Database paused**: Resume it in Vercel Storage
4. **Environment not selected**: Make sure variables are set for "Production" environment
5. **Old deployment**: Redeploy after setting variables

