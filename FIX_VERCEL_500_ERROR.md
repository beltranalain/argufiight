# Fix Vercel 500 Error on Signup/Login

## Problem
Getting 500 Internal Server Error when trying to sign up or log in on Vercel.

## Common Causes

### 1. Missing DATABASE_URL (Most Common)
**Symptom:** 500 error, database connection fails

**Fix:**
1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add `DATABASE_URL`:
   - If using **Vercel Postgres**: Get from Storage tab
   - If using **Supabase**: Get from Settings → Database → Connection string
   - If using **Railway**: Get from Railway database service
3. Make sure to select **Production**, **Preview**, and **Development** environments
4. **Redeploy** after adding

### 2. Database Not Migrated
**Symptom:** Tables don't exist

**Fix:**
Run migrations on Vercel:
```powershell
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy
```

Or use Vercel's built-in migration:
1. Vercel Dashboard → Your Project → **Settings** → **Build & Development Settings**
2. Add to **Build Command**: `npm run build && npx prisma migrate deploy`

### 3. Missing AUTH_SECRET
**Symptom:** Session creation fails

**Fix:**
1. Generate AUTH_SECRET:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Add to Vercel Environment Variables:
   - Name: `AUTH_SECRET`
   - Value: (paste generated value)
   - Environments: Production, Preview, Development
3. **Redeploy**

### 4. Missing DIRECT_URL
**Symptom:** Prisma connection pooling issues

**Fix:**
1. If using connection pooling (like Prisma Accelerate), add `DIRECT_URL`
2. Usually same as `DATABASE_URL` but without pooling
3. Add to Vercel Environment Variables

### 5. Prisma Client Not Generated
**Symptom:** Prisma client errors

**Fix:**
The build script should handle this, but verify:
1. Check `package.json` build script includes: `node scripts/regenerate-prisma.js`
2. Check Vercel build logs for Prisma generation
3. Should see: `✔ Generated Prisma Client`

---

## Step-by-Step Fix

### Step 1: Check Vercel Logs
1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click on latest deployment
3. Click **"View Function Logs"** or **"Runtime Logs"**
4. Look for error messages - they'll tell you what's missing

### Step 2: Verify Environment Variables
Go to Vercel → Settings → Environment Variables and verify you have:

**Required:**
- ✅ `DATABASE_URL` - PostgreSQL connection string
- ✅ `AUTH_SECRET` - Random 32+ character string
- ✅ `NEXT_PUBLIC_APP_URL` - Your Vercel URL or custom domain

**Optional but Recommended:**
- `DIRECT_URL` - Direct database connection (if using pooling)
- `NODE_ENV` - Set to `production`

### Step 3: Set Up Database (If Not Done)

**Option A: Vercel Postgres (Easiest)**
1. Vercel Dashboard → Your Project → **Storage** tab
2. Click **"Create Database"** → **"Postgres"**
3. Follow setup wizard
4. Copy connection string to `DATABASE_URL`
5. Run migrations (see Step 4)

**Option B: Supabase (Free)**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy connection string (use "Connection pooling" for `DATABASE_URL`)
5. Copy "Direct connection" for `DIRECT_URL` (if needed)

**Option C: Railway (If You Have It)**
1. Railway Dashboard → Your Database Service
2. Copy `DATABASE_URL` from Variables tab
3. Use this in Vercel Environment Variables

### Step 4: Run Database Migrations

**Method 1: Via Vercel CLI (Recommended)**
```powershell
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project (if not already)
cd C:\Users\beltr\Honorable.AI
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy
```

**Method 2: Via Vercel Dashboard**
1. Add to Build Command in Vercel:
   - Go to Settings → Build & Development Settings
   - Build Command: `npm run build && npx prisma migrate deploy`
   - This runs migrations on every deploy

**Method 3: Manual SQL (Last Resort)**
If migrations fail, you can run the SQL manually in your database:
1. Get your database admin panel (Vercel Postgres, Supabase, etc.)
2. Run the SQL from `prisma/migrations/` folder

### Step 5: Generate AUTH_SECRET

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and add to Vercel Environment Variables as `AUTH_SECRET`.

### Step 6: Redeploy

After adding/updating environment variables:
1. Go to Vercel Dashboard → Deployments
2. Click **three dots** (⋯) on latest deployment
3. Click **"Redeploy"**
4. Wait for build to complete

### Step 7: Test

1. Go to your site: `https://honorable-ai.com` (or your Vercel URL)
2. Try to sign up
3. Check Vercel Function Logs if it still fails

---

## Quick Checklist

Before testing, verify:

- [ ] `DATABASE_URL` is set in Vercel (Production, Preview, Development)
- [ ] `AUTH_SECRET` is set in Vercel (Production, Preview, Development)
- [ ] `NEXT_PUBLIC_APP_URL` is set to your domain
- [ ] Database migrations have been run
- [ ] Database tables exist (User, Session, etc.)
- [ ] Vercel build completed successfully
- [ ] No errors in Vercel Function Logs

---

## Debugging Tips

### Check Vercel Function Logs
1. Vercel Dashboard → Your Project → **Deployments**
2. Click on deployment → **"Functions"** tab
3. Click on `/api/auth/signup` function
4. View logs - you'll see the actual error

### Test Database Connection
Add a test API route to check database:

```typescript
// app/api/test-db/route.ts
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    await prisma.$connect()
    const userCount = await prisma.user.count()
    return NextResponse.json({ 
      connected: true, 
      userCount,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Missing'
    })
  } catch (error) {
    return NextResponse.json({ 
      connected: false, 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
```

Then visit: `https://your-site.vercel.app/api/test-db`

### Common Error Messages

**"Can't reach database server"**
- DATABASE_URL is wrong or database is not accessible
- Check connection string format
- Verify database allows connections from Vercel IPs

**"Table does not exist"**
- Migrations not run
- Run `npx prisma migrate deploy`

**"Prisma Client not generated"**
- Build script issue
- Check build logs for Prisma generation

**"Session creation failed"**
- AUTH_SECRET missing or invalid
- Check environment variable is set

---

## Still Not Working?

1. **Check Vercel Function Logs** - Most important!
2. **Verify all environment variables** are set correctly
3. **Test database connection** using test route above
4. **Check Prisma schema** matches your database
5. **Contact Vercel support** - They're very helpful

---

## Environment Variables Template

Here's what you need in Vercel:

```
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
DIRECT_URL=postgresql://user:password@host:5432/database?sslmode=require
AUTH_SECRET=your-64-character-hex-string-here
NEXT_PUBLIC_APP_URL=https://honorable-ai.com
NODE_ENV=production
```

Make sure to select **Production**, **Preview**, and **Development** for each variable!


