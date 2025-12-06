# Update Vercel Environment Variables for Neon

## Problem

Vercel is still trying to connect to the old Prisma Data Platform (`db.prisma.io:5432`) instead of Neon.

## Solution: Update Vercel Environment Variables

You need to update the environment variables in your Vercel dashboard.

### Step 1: Go to Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Sign in to your account
3. Select your project (`argufight` or `honorable-ai`)
4. Go to **Settings** → **Environment Variables**

### Step 2: Update DATABASE_URL

1. Find `DATABASE_URL` in the list
2. Click **Edit** (or delete and recreate if needed)
3. **Value:** Use this Neon connection string (pooled):
   ```
   postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
4. **Environments:** Check ✅ **Production**, ✅ **Preview**, ✅ **Development**
5. Click **Save**

### Step 3: Update DIRECT_URL

1. Find `DIRECT_URL` in the list (or create it if missing)
2. Click **Edit** (or **Add New** if it doesn't exist)
3. **Value:** Use this Neon connection string (unpooled - for migrations):
   ```
   postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
   **Note:** This is the same as `DATABASE_URL` but **without** `-pooler` in the hostname
4. **Environments:** Check ✅ **Production**, ✅ **Preview**, ✅ **Development**
5. Click **Save**

### Step 4: Remove Old Prisma Variables (Optional)

If you see these old variables, you can delete them (they're no longer needed):
- `POSTGRES_URL` (old Prisma)
- `PRISMA_DATABASE_URL` (old Prisma)

**Don't delete:** `DATABASE_URL` and `DIRECT_URL` - just update their values!

### Step 5: Redeploy

**CRITICAL:** After updating environment variables, you MUST redeploy:

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **...** (three dots) → **Redeploy**
4. Wait for deployment to complete (~2-3 minutes)

### Step 6: Verify

After redeploy, test the connection:

1. Go to your live site
2. Check if it loads (no database errors)
3. Try logging in
4. Check admin dashboard

## Quick Reference: Connection Strings

**DATABASE_URL** (pooled - for regular queries):
```
postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**DIRECT_URL** (unpooled - for migrations):
```
postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Difference:** `DATABASE_URL` has `-pooler` in the hostname, `DIRECT_URL` does not.

## Troubleshooting

### "Environment variable conflict"

If Vercel says there's a conflict:
1. Delete the old `DATABASE_URL` first
2. Create a new one with the Neon value
3. Or use a different name temporarily, then rename

### "Still connecting to db.prisma.io"

1. Double-check you updated the **correct** environment (Production)
2. Make sure you **redeployed** after updating
3. Check if there are multiple `DATABASE_URL` entries (delete duplicates)

### "Can't find DIRECT_URL"

If `DIRECT_URL` doesn't exist:
1. Click **Add New**
2. Key: `DIRECT_URL`
3. Value: The unpooled Neon connection string
4. Environments: All ✅
5. Save

## Important Notes

⚠️ **Always redeploy after changing environment variables**  
⚠️ **Make sure both Production and Preview are updated**  
⚠️ **DATABASE_URL uses `-pooler`, DIRECT_URL does not**  
✅ **Both are required for Prisma to work correctly**

## After Updating

Once you've updated and redeployed:

1. Your live site should connect to Neon
2. All database queries should work
3. Migrations can run (if needed)
4. Everything should function normally

---

**Status:** Update Vercel environment variables → Redeploy → Test

