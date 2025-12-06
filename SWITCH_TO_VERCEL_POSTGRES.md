# Switch from Prisma Data Platform to Vercel Postgres

## Why Switch?
- ✅ No plan limits blocking your app
- ✅ Better integration with Vercel
- ✅ Free tier available
- ✅ No connection pooling issues
- ✅ Same PostgreSQL, works with your existing Prisma schema

## Step-by-Step Migration

### Step 1: Create Vercel Postgres Database

1. Go to your Vercel project dashboard
2. Click the **Storage** tab (left sidebar)
3. Click **Create Database**
4. Select **Postgres**
5. Choose a plan:
   - **Hobby** (Free) - Good for development/small apps
   - **Pro** - For production (starts at $20/month)
6. Select a region (choose closest to your users)
7. Click **Create**

### Step 2: Get Connection Strings

1. In Vercel Storage, click on your new Postgres database
2. Click the **.env.local** tab
3. You'll see these variables:
   - `POSTGRES_URL` - Use this for `DATABASE_URL` (has pgbouncer)
   - `POSTGRES_PRISMA_URL` - Use this for `DIRECT_URL` (no pgbouncer)

**Example:**
```
POSTGRES_URL=postgres://default:xxx@ep-xxx.us-east-1.postgres.vercel-storage.com:5432/verceldb?sslmode=require&pgbouncer=true
POSTGRES_PRISMA_URL=postgres://default:xxx@ep-xxx.us-east-1.postgres.vercel-storage.com:5432/verceldb?sslmode=require
```

### Step 3: Update Vercel Environment Variables

1. Go to **Settings** → **Environment Variables**
2. **Update `DATABASE_URL`:**
   - Value: Copy `POSTGRES_URL` from Step 2
   - Environment: Production, Preview, Development
3. **Update `DIRECT_URL`:**
   - Value: Copy `POSTGRES_PRISMA_URL` from Step 2
   - Environment: Production, Preview, Development
4. Click **Save** for each

### Step 4: Run Migrations

Your Prisma schema is already PostgreSQL, so it will work as-is. You just need to run migrations:

**Option A: Via Vercel CLI (Recommended)**
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Link to your project
vercel link

# Run migrations
npx prisma migrate deploy
```

**Option B: Via Vercel Dashboard**
1. Go to your project → **Settings** → **Build & Development Settings**
2. Add a build command that runs migrations:
   ```
   prisma migrate deploy && next build
   ```
   (But this might slow down builds, so Option A is better)

**Option C: Manual Migration Script**
Create a one-time migration script and run it locally with the new connection strings.

### Step 5: Migrate Data (If Needed)

If you have existing data in Prisma Data Platform:

1. **Export from Prisma:**
   ```bash
   # Connect to old database
   export DATABASE_URL="old-prisma-connection-string"
   npx prisma db pull
   npx prisma db seed  # If you have seed data
   ```

2. **Import to Vercel Postgres:**
   ```bash
   # Connect to new database
   export DATABASE_URL="new-vercel-postgres-url"
   export DIRECT_URL="new-vercel-postgres-direct-url"
   npx prisma migrate deploy
   npx prisma db seed  # If you have seed data
   ```

**Or use pg_dump/pg_restore:**
```bash
# Export from old database
pg_dump "old-connection-string" > backup.sql

# Import to new database
psql "new-connection-string" < backup.sql
```

### Step 6: Redeploy

1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger deployment

### Step 7: Test Connection

After redeploy:

1. Test environment variables:
   ```
   https://your-app.vercel.app/api/check-env
   ```

2. Test database connection:
   ```
   https://your-app.vercel.app/api/test-db
   ```

3. Try logging in to your app

## What Changes in Your Code?

**Nothing!** Your Prisma schema and code stay exactly the same. You're just changing the connection strings.

## Cost Comparison

**Prisma Data Platform:**
- Free tier: Limited (you hit the limit)
- Pro: $25/month
- Team: $99/month

**Vercel Postgres:**
- Hobby (Free): 256 MB storage, 60 hours compute/month
- Pro: $20/month - 8 GB storage, unlimited compute
- Enterprise: Custom pricing

## Troubleshooting

### Migration Fails
- Make sure `DIRECT_URL` is set correctly (without pgbouncer)
- Check that the database is created and active
- Verify connection strings in Vercel

### Connection Errors
- Ensure both `DATABASE_URL` and `DIRECT_URL` are set
- Check that variables are enabled for Production
- Redeploy after setting variables

### Data Migration Issues
- Use `pg_dump` for large databases
- For small databases, Prisma migrations should work
- Test locally first with new connection strings

## Next Steps After Migration

1. ✅ Test all features work
2. ✅ Monitor Vercel logs for any issues
3. ✅ Update any documentation with new connection info
4. ✅ Consider canceling Prisma Data Platform subscription (if you have one)

## Need Help?

If you want me to:
- Help you create the Vercel Postgres database
- Write a migration script
- Test the new connection
- Troubleshoot any issues

Just let me know!

