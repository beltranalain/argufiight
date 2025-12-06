# Quick Migration Checklist: Prisma → Vercel Postgres

## ✅ Step-by-Step Checklist

### Step 1: Create Vercel Postgres (5 minutes)
- [ ] Go to Vercel Dashboard → Your Project
- [ ] Click **Storage** tab (left sidebar)
- [ ] Click **Create Database** → Select **Postgres**
- [ ] Choose plan: **Hobby** (Free) or **Pro** ($20/month)
- [ ] Select region → Click **Create**
- [ ] Wait for database to be created (~30 seconds)

### Step 2: Get Connection Strings (2 minutes)
- [ ] Click on your new Postgres database
- [ ] Click **.env.local** tab
- [ ] Copy `POSTGRES_URL` (for DATABASE_URL)
- [ ] Copy `POSTGRES_PRISMA_URL` (for DIRECT_URL)
- [ ] Keep these values handy for next step

### Step 3: Update Environment Variables (3 minutes)
- [ ] Go to **Settings** → **Environment Variables**
- [ ] Find or create `DATABASE_URL`:
  - [ ] Paste `POSTGRES_URL` value
  - [ ] Check ✅ Production, Preview, Development
  - [ ] Click **Save**
- [ ] Find or create `DIRECT_URL`:
  - [ ] Paste `POSTGRES_PRISMA_URL` value
  - [ ] Check ✅ Production, Preview, Development
  - [ ] Click **Save**
- [ ] Verify both show in the list with Production ✅

### Step 4: Run Migrations (5 minutes)

**Option A: Using Helper Script (Recommended)**
```bash
# Set environment variables locally (temporarily)
export DATABASE_URL="your-postgres-url-from-vercel"
export DIRECT_URL="your-postgres-prisma-url-from-vercel"

# Run migration helper
node scripts/migrate-to-vercel-postgres.js
```

**Option B: Manual Migration**
```bash
# Set environment variables
export DATABASE_URL="your-postgres-url-from-vercel"
export DIRECT_URL="your-postgres-prisma-url-from-vercel"

# Run migrations
npx prisma migrate deploy
```

### Step 5: Redeploy (2 minutes)
- [ ] Go to **Deployments** tab
- [ ] Click **...** (three dots) on latest deployment
- [ ] Click **Redeploy**
- [ ] Wait for deployment to complete (~2-3 minutes)

### Step 6: Test (2 minutes)
- [ ] Test environment: `https://your-app.vercel.app/api/check-env`
  - Should show `hasDatabaseUrl: true` and `hasDirectUrl: true`
- [ ] Test database: `https://your-app.vercel.app/api/test-db`
  - Should show `success: true`
- [ ] Test login: Try logging in to your app
  - Should work without errors

## 🎉 Done!

Your app should now be using Vercel Postgres instead of Prisma Data Platform.

## ⚠️ Troubleshooting

**"Can't reach database server"**
- Check database is created and active in Vercel
- Verify connection strings are correct
- Make sure variables are set for Production

**"Migration failed"**
- Check `DIRECT_URL` is set (without pgbouncer)
- Verify you have write permissions
- Check Vercel logs for detailed errors

**"Environment variables not found"**
- Make sure variables are set for Production
- Redeploy after setting variables

## 📝 Need Help?

See detailed guide: `MIGRATE_TO_VERCEL_POSTGRES.md`

