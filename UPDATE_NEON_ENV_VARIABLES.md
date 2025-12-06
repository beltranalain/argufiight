# Update Vercel Environment Variables for Neon

## Connection Strings from Neon

You have your Neon connection strings! Now let's update Vercel.

## Step 1: Update Environment Variables in Vercel

Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

### Update DATABASE_URL

1. Find `DATABASE_URL` in the list (or create it if missing)
2. Click **Edit**
3. **Value:** Use the **pooled** connection (with `-pooler`):
   ```
   postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
4. **Environments:** Check ✅ **Production**, **Preview**, **Development**
5. Click **Save**

### Update DIRECT_URL

1. Find `DIRECT_URL` in the list (or create it if missing)
2. Click **Edit**
3. **Value:** Use the **unpooled** connection (without `-pooler`):
   ```
   postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
4. **Environments:** Check ✅ **Production**, **Preview**, **Development**
5. Click **Save**

## Quick Reference

**DATABASE_URL** (pooled - for regular queries):
```
postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**DIRECT_URL** (unpooled - for migrations):
```
postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Step 2: Verify Variables

After updating, verify:
- ✅ `DATABASE_URL` is set (pooled connection)
- ✅ `DIRECT_URL` is set (unpooled connection)
- ✅ Both are enabled for **Production** environment

## Step 3: Run Migrations Locally (Test First)

Before deploying, test the connection locally:

```bash
# Set environment variables temporarily
export DATABASE_URL="postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
export DIRECT_URL="postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Test connection
npx prisma db pull

# Run migrations
npx prisma migrate deploy
```

## Step 4: Redeploy Application

1. Go to **Deployments** tab
2. Click **...** (three dots) on latest deployment
3. Click **Redeploy**
4. Wait for deployment (~2-3 minutes)

## Step 5: Test Connection

After deployment:

1. **Test environment variables:**
   ```
   https://your-app.vercel.app/api/check-env
   ```
   Should show:
   ```json
   {
     "hasDatabaseUrl": true,
     "hasDirectUrl": true,
     "databaseUrlPrefix": "postgresql://neondb_owner..."
   }
   ```

2. **Test database connection:**
   ```
   https://your-app.vercel.app/api/test-db
   ```
   Should show:
   ```json
   {
     "success": true,
     "userCount": 0,
     "hasDatabaseUrl": true,
     "hasDirectUrl": true
   }
   ```

3. **Test login:**
   - Try logging in to your app
   - Should work without the Prisma plan limit error!

## Important Notes

- **Pooled connection** (`-pooler`) is for regular queries (DATABASE_URL)
- **Unpooled connection** (no `-pooler`) is for migrations (DIRECT_URL)
- Both use the same credentials, just different endpoints
- Make sure both are set for **Production** environment

## Troubleshooting

**"Can't reach database server"**
- Check connection strings are correct
- Verify variables are set for Production
- Check Neon dashboard to ensure database is active

**"Migration failed"**
- Make sure `DIRECT_URL` uses the unpooled connection (no `-pooler`)
- Check you have write permissions
- Verify connection string format

## Success!

Once you've updated the variables and redeployed, your app should work without the Prisma plan limit error! 🎉

