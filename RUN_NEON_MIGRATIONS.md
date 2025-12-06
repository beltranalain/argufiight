# Run Migrations on Neon Database

## Problem
```
The table `public.users` does not exist in the current database.
```

This means your Neon database is empty - it needs migrations to create all tables.

## Solution: Run Prisma Migrations

### Step 1: Set Environment Variables Locally

You need to set the Neon connection strings locally to run migrations:

**Windows PowerShell:**
```powershell
$env:DATABASE_URL="postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
$env:DIRECT_URL="postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

**Windows CMD:**
```cmd
set DATABASE_URL=postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
set DIRECT_URL=postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Linux/Mac:**
```bash
export DATABASE_URL="postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
export DIRECT_URL="postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### Step 2: Test Connection

Verify you can connect to Neon:

```bash
npx prisma db pull
```

This should connect successfully. If it fails, check your connection strings.

### Step 3: Run Migrations

Create all tables in your Neon database:

```bash
npx prisma migrate deploy
```

This will:
- Create all tables from your Prisma schema
- Set up indexes and relationships
- Create the `users` table and all other tables

### Step 4: Verify Tables Created

Check that tables were created:

```bash
npx prisma studio
```

This opens Prisma Studio where you can see all your tables.

Or test with a simple query:

```bash
npx prisma db execute --stdin
```

Then type:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

You should see tables like: `users`, `debates`, `statements`, `sessions`, etc.

### Step 5: Alternative: Use Prisma db push

If `migrate deploy` doesn't work (no migration history), use:

```bash
npx prisma db push
```

This will:
- Push your schema directly to the database
- Create all tables
- ⚠️ Note: This doesn't create migration history, but works for new databases

### Step 6: Redeploy Application

After migrations are complete:

1. Go to **Vercel** → **Deployments**
2. Click **Redeploy** on latest deployment
3. Wait for deployment

### Step 7: Test

After redeploy:

1. Test database: `https://your-app.vercel.app/api/test-db`
   - Should show `success: true` and `userCount: 0`

2. Test login - Should work now!

## Troubleshooting

### "Migration failed"
- Make sure `DIRECT_URL` uses the unpooled connection (no `-pooler`)
- Check you have write permissions
- Verify connection strings are correct

### "No migrations found"
- Use `npx prisma db push` instead of `migrate deploy`
- This creates tables directly from schema

### "Can't connect to database"
- Verify connection strings are correct
- Check Neon dashboard - is database active?
- Make sure you're using the right endpoint (pooled vs unpooled)

## Quick Command Summary

```powershell
# Set environment variables (PowerShell)
$env:DATABASE_URL="postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
$env:DIRECT_URL="postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Run migrations
npx prisma migrate deploy

# Or if no migrations exist:
npx prisma db push
```

## After Migrations

Once migrations are complete, your app should work! The `users` table and all other tables will exist in Neon.

