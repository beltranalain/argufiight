# Step-by-Step: Migrate to Vercel Postgres

## Current Status
✅ Prisma schema is PostgreSQL (ready to migrate)
✅ Code doesn't need changes
❌ Prisma Data Platform has plan limit

## Migration Steps

### Step 1: Create Vercel Postgres Database

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your project (argufight)

2. **Create Postgres Database:**
   - Click **Storage** tab (left sidebar)
   - Click **Create Database** button
   - Select **Postgres**
   - Choose plan:
     - **Hobby** (Free) - 256 MB, 60 hours/month compute
     - **Pro** ($20/month) - 8 GB, unlimited compute
   - Select region (choose closest to your users)
   - Click **Create**

3. **Wait for database to be created** (takes ~30 seconds)

### Step 2: Get Connection Strings

1. **In Vercel Storage:**
   - Click on your new Postgres database
   - Click **.env.local** tab
   - You'll see:
     ```
     POSTGRES_URL=postgres://default:xxx@ep-xxx.us-east-1.postgres.vercel-storage.com:5432/verceldb?sslmode=require&pgbouncer=true
     POSTGRES_PRISMA_URL=postgres://default:xxx@ep-xxx.us-east-1.postgres.vercel-storage.com:5432/verceldb?sslmode=require
     ```

2. **Copy both values** - You'll need them in the next step

### Step 3: Update Vercel Environment Variables

1. **Go to Settings:**
   - Vercel Dashboard → Your Project → **Settings** → **Environment Variables**

2. **Update DATABASE_URL:**
   - Find `DATABASE_URL` in the list
   - Click **Edit** (or create if it doesn't exist)
   - **Value:** Paste the `POSTGRES_URL` from Step 2
   - **Environments:** Check ✅ Production, Preview, Development
   - Click **Save**

3. **Update DIRECT_URL:**
   - Find `DIRECT_URL` in the list (or create it)
   - Click **Edit**
   - **Value:** Paste the `POSTGRES_PRISMA_URL` from Step 2
   - **Environments:** Check ✅ Production, Preview, Development
   - Click **Save**

4. **Verify:**
   - Both variables should show in the list
   - Both should have Production ✅ checked

### Step 4: Run Migrations Locally (Test First)

Before deploying, test the migration locally:

1. **Create a temporary .env file:**
   ```bash
   # Copy your new connection strings to a test .env file
   echo "DATABASE_URL=your-postgres-url-from-vercel" > .env.test
   echo "DIRECT_URL=your-postgres-prisma-url-from-vercel" >> .env.test
   ```

2. **Test connection:**
   ```bash
   # Load the test env and try to connect
   export $(cat .env.test | xargs)
   npx prisma db pull
   ```

3. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

### Step 5: Run Migrations in Production

**Option A: Via Vercel CLI (Recommended)**

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm i -g vercel
   ```

2. **Link to your project:**
   ```bash
   vercel link
   ```
   - Select your project
   - Select production

3. **Run migrations:**
   ```bash
   # This will use the environment variables from Vercel
   vercel env pull .env.production
   npx prisma migrate deploy
   ```

**Option B: Via Vercel Dashboard**

1. Go to **Deployments** tab
2. Click **Redeploy** on latest deployment
3. Migrations will run automatically if you have a postinstall script

**Option C: Manual Migration Script**

I can create a migration script that you can run. Let me know if you want this option.

### Step 6: Redeploy Application

1. **Go to Deployments:**
   - Vercel Dashboard → **Deployments** tab

2. **Redeploy:**
   - Click **...** (three dots)** on latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger deployment

3. **Wait for deployment** (~2-3 minutes)

### Step 7: Test Connection

After deployment completes:

1. **Test environment variables:**
   ```
   https://your-app.vercel.app/api/check-env
   ```
   Should show:
   ```json
   {
     "hasDatabaseUrl": true,
     "hasDirectUrl": true,
     "databaseUrlPrefix": "postgres://default:xxx@ep-xxx..."
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
   - Should work without errors

## Migrating Existing Data (If Needed)

If you have data in your old Prisma database that you want to keep:

### Option 1: Export/Import with pg_dump

1. **Export from old database:**
   ```bash
   pg_dump "old-prisma-connection-string" > backup.sql
   ```

2. **Import to new database:**
   ```bash
   psql "new-vercel-postgres-url" < backup.sql
   ```

### Option 2: Use Prisma Migrate

If your data is small, you can:
1. Run migrations on new database
2. Manually copy important data
3. Or use Prisma's data migration tools

## Troubleshooting

### "Can't reach database server"
- Check that database is created and active in Vercel
- Verify connection strings are correct
- Make sure variables are set for Production environment

### "Migration failed"
- Check `DIRECT_URL` is set (without pgbouncer)
- Verify you have write permissions
- Check Vercel logs for detailed errors

### "Environment variables not found"
- Make sure variables are set for Production
- Redeploy after setting variables
- Check variable names match exactly

## Next Steps After Migration

1. ✅ Test all features work
2. ✅ Monitor Vercel logs
3. ✅ Update any documentation
4. ✅ Consider canceling Prisma Data Platform (if you have subscription)

## Need Help?

If you get stuck at any step, let me know and I can help troubleshoot!

