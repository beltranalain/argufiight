# Troubleshoot Database Connection

## Current Error
```
Can't reach database server at `db.prisma.io:5432`
```

Even after adding `DIRECT_URL`, the error persists. Let's debug systematically.

## Step 1: Verify Environment Variables in Vercel

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Your project → **Settings** → **Environment Variables**

2. **Check Each Variable:**
   - `DATABASE_URL` - Should be set for **Production**
   - `DIRECT_URL` - Should be set for **Production** (same value as DATABASE_URL)
   - `AUTH_SECRET` - Should be set for **Production**

3. **Verify Production Checkbox:**
   - For each variable, make sure **Production** is checked ✅
   - If not checked, edit and check it

## Step 2: Check Vercel Function Logs

1. **Go to Deployments:**
   - Click **Deployments** tab
   - Click on the latest deployment
   - Click **Functions** tab

2. **Look for Errors:**
   - Check `/api/auth/login` function logs
   - Look for database connection errors
   - Check if `DATABASE_URL` is being read

3. **Check Build Logs:**
   - In the deployment, check **Build Logs**
   - Look for Prisma Client generation errors
   - Verify build completed successfully

## Step 3: Clear Build Cache and Redeploy

1. **In Vercel Dashboard:**
   - Go to **Deployments**
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**
   - **IMPORTANT:** Uncheck **"Use existing Build Cache"**
   - Click **"Redeploy"**

2. **Wait for Build:**
   - Watch the build logs
   - Verify `prisma generate` runs successfully
   - Check for any errors

## Step 4: Verify Database is Accessible

The database might be paused or have network issues:

1. **Check Prisma Console:**
   - Go to https://console.prisma.io
   - Check if your database is active
   - If paused, resume it

2. **Test Connection:**
   - In Prisma Console, try to connect
   - Verify the connection string works

## Step 5: Check Connection String Format

Your connection string should be:
```
postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require
```

**Verify:**
- Starts with `postgres://`
- Has username:password before `@`
- Has `@db.prisma.io:5432`
- Has `?sslmode=require` at the end
- No extra spaces or characters

## Step 6: Test with a Simple API Route

Create a test endpoint to verify connection:

```typescript
// app/api/test-db/route.ts
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    await prisma.$connect()
    const userCount = await prisma.user.count()
    return NextResponse.json({ 
      success: true, 
      userCount,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_URL,
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_URL,
    }, { status: 500 })
  }
}
```

Then visit: `https://your-app.vercel.app/api/test-db`

## Step 7: Check if Database is Paused

Prisma databases can auto-pause after inactivity:

1. **Go to Prisma Console:**
   - https://console.prisma.io
   - Find your database
   - Check status (Active/Paused)

2. **If Paused:**
   - Click "Resume" or "Wake Up"
   - Wait 30 seconds
   - Try again

## Step 8: Verify Network Access

The error `Can't reach database server` suggests:
- Network firewall blocking connection
- Database server is down
- Connection string is wrong

**Check:**
1. Is `db.prisma.io` reachable? (Try pinging it)
2. Is port 5432 open?
3. Is SSL required? (Your connection string has `sslmode=require`)

## Step 9: Alternative - Use Prisma Accelerate

You have `PRISMA_DATABASE_URL` configured. You could switch to using it:

1. **Update schema.prisma:**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("PRISMA_DATABASE_URL")
   }
   ```

2. **Remove `directUrl`** (Accelerate handles this)

3. **Redeploy**

## Most Likely Issues

1. **Environment variables not set for Production** - Check Step 1
2. **Build cache issue** - Clear cache and redeploy (Step 3)
3. **Database paused** - Resume in Prisma Console (Step 7)
4. **Wrong connection string format** - Verify Step 5

## Quick Test

After redeploying, check Vercel function logs:
1. Go to Deployments → Latest → Functions
2. Try to login
3. Check the `/api/auth/login` function logs
4. Look for the actual error message

The error should show if it's:
- Missing DATABASE_URL
- Connection timeout
- Authentication failure
- Network unreachable

