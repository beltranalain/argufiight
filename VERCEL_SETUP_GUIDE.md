# Vercel Deployment Setup Guide

Your code is now on GitHub! Next step: Deploy to Vercel.

## Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** (recommended - easiest way)
4. Authorize Vercel to access your GitHub account

## Step 2: Import Your Project

1. After signing in, click **"Add New..."** → **"Project"**
2. You should see your `Honorable.AI` repository listed
3. Click **"Import"** next to `beltranalain/Honorable.AI`

## Step 3: Configure Project Settings

Vercel will auto-detect Next.js. Configure these settings:

### Framework Preset
- **Framework Preset**: Next.js (should be auto-detected)

### Root Directory
- Leave as **`.`** (root)

### Build Settings
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### Environment Variables
Click **"Environment Variables"** and add:

```
DATABASE_URL=file:./prisma/dev.db
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
```

**Important Notes:**
- For production, you'll need a real database (not SQLite file)
- Consider using Vercel Postgres, Supabase, or PlanetScale
- For now, you can deploy and we'll set up the database later

## Step 4: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. Vercel will give you a URL like: `https://honorable-ai.vercel.app`

## Step 5: Post-Deployment Setup

### Option A: Use Vercel Postgres (Recommended for Production)

1. In Vercel dashboard, go to **Storage** tab
2. Click **"Create Database"** → **"Postgres"**
3. Copy the connection string
4. Update `DATABASE_URL` in Environment Variables
5. Run migrations: `npx prisma migrate deploy`

### Option B: Use Supabase (Free Tier Available)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get the connection string from Settings → Database
4. Update `DATABASE_URL` in Vercel Environment Variables
5. Run migrations: `npx prisma migrate deploy`

### Option C: Keep SQLite (Not Recommended for Production)

- SQLite files don't persist on Vercel
- Only use for testing/development

## Step 6: Update Environment Variables

After setting up your database:

1. Go to your project in Vercel
2. Click **Settings** → **Environment Variables**
3. Update `DATABASE_URL` with your production database URL
4. Add any other required environment variables
5. Click **"Redeploy"** to apply changes

## Troubleshooting

### Build Fails
- Check the build logs in Vercel dashboard
- Common issues:
  - Missing environment variables
  - TypeScript errors
  - Missing dependencies

### Database Connection Issues
- Make sure `DATABASE_URL` is set correctly
- For Postgres, ensure SSL is enabled
- Check that migrations have run

### Need Help?
- Check Vercel logs: Project → Deployments → Click on deployment → View logs
- Check build logs for errors

## Next Steps After Deployment

1. ✅ Test your live site
2. ✅ Set up custom domain (optional)
3. ✅ Configure production database
4. ✅ Set up environment variables
5. ✅ Test all features on live site

---

**Quick Links:**
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)










