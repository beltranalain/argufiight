# Deployment Guide: GitHub + Vercel

This guide will walk you through deploying your Honorable.AI project to production using GitHub and Vercel.

## Prerequisites

- ✅ Your project builds successfully (`npm run build` passes)
- ✅ You have a GitHub account
- ✅ You have a Vercel account (or can create one)

---

## Part 1: Setting Up GitHub Repository

### Step 1: Create a New Repository on GitHub

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right corner
3. Select **"New repository"**
4. Fill in the repository details:
   - **Repository name**: `Honorable.AI` (or your preferred name)
   - **Description**: "AI-Powered Debate Platform"
   - **Visibility**: Choose **Private** (recommended) or **Public**
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

### Step 2: Initialize Git in Your Project (if not already done)

Open PowerShell in your project directory (`C:\Users\beltr\Honorable.AI`) and run:

```powershell
# Check if git is already initialized
git status

# If not initialized, run:
git init
```

### Step 3: Create/Update .gitignore File

Make sure your `.gitignore` file includes:

```
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local
.env

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Database
*.db
*.db-journal
prisma/dev.db
prisma/test.db

# Uploads
public/uploads/

# Mobile app
mobile/node_modules/
mobile/.expo/
mobile/.expo-shared/
mobile/dist/
mobile/build/
```

### Step 4: Stage and Commit Your Code

```powershell
# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Production-ready build"

# If you have previous commits, you can also do:
# git commit -m "Fix: All TypeScript build errors resolved"
```

### Step 5: Connect to GitHub Repository

```powershell
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/Honorable.AI.git

# Or if you prefer SSH:
# git remote add origin git@github.com:YOUR_USERNAME/Honorable.AI.git

# Verify the remote was added
git remote -v
```

### Step 6: Push to GitHub

```powershell
# Push to main branch
git branch -M main
git push -u origin main

# If you get authentication errors, GitHub may prompt you to:
# 1. Use a Personal Access Token (PAT) instead of password
# 2. Or set up SSH keys
```

**Note**: If you need to authenticate:
- Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
- Generate a new token with `repo` permissions
- Use this token as your password when pushing

---

## Part 2: Setting Up Vercel Account

### Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** (recommended - easiest integration)
4. Authorize Vercel to access your GitHub account
5. Complete your profile setup

### Step 2: Install Vercel CLI (Optional but Recommended)

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login
```

---

## Part 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click **"Add New..."** → **"Project"**

2. **Import Your GitHub Repository**
   - You'll see a list of your GitHub repositories
   - Find and click **"Import"** next to `Honorable.AI`

3. **Configure Project Settings**
   - **Project Name**: `Honorable.AI` (or your preferred name)
   - **Framework Preset**: Should auto-detect as "Next.js"
   - **Root Directory**: Leave as `./` (unless your Next.js app is in a subfolder)
   - **Build Command**: `npm run build` (should be auto-filled)
   - **Output Directory**: `.next` (should be auto-filled)
   - **Install Command**: `npm install` (should be auto-filled)

4. **Environment Variables**
   - Click **"Environment Variables"**
   - Add the following variables (if you have them):
     ```
     DATABASE_URL=file:./prisma/dev.db
     NEXTAUTH_SECRET=your-secret-key-here
     NEXTAUTH_URL=https://your-app.vercel.app
     ```
   - **Note**: For production, you'll need a proper database (not SQLite file)
   - Consider using:
     - **Vercel Postgres** (recommended - built-in)
     - **PlanetScale** (MySQL)
     - **Supabase** (PostgreSQL)
     - **Railway** (PostgreSQL)

5. **Deploy**
   - Click **"Deploy"**
   - Wait for the build to complete (usually 2-5 minutes)
   - You'll get a URL like: `https://honorable-ai.vercel.app`

### Option B: Deploy via Vercel CLI

```powershell
# Make sure you're in the project directory
cd C:\Users\beltr\Honorable.AI

# Deploy to Vercel
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (Select your account)
# - Link to existing project? No (first time)
# - Project name? Honorable.AI
# - Directory? ./
# - Override settings? No

# For production deployment:
vercel --prod
```

---

## Part 4: Post-Deployment Configuration

### Step 1: Update Environment Variables

1. Go to your project in Vercel Dashboard
2. Click **Settings** → **Environment Variables**
3. Add/Update:
   - `DATABASE_URL` - Your production database URL
   - `NEXTAUTH_SECRET` - Generate a secure random string
   - `NEXTAUTH_URL` - Your Vercel deployment URL

### Step 2: Set Up Production Database

**Option 1: Vercel Postgres (Easiest)**
1. In Vercel Dashboard → Your Project → **Storage** tab
2. Click **"Create Database"** → **"Postgres"**
3. Follow the setup wizard
4. Copy the connection string to `DATABASE_URL`

**Option 2: External Database**
- **PlanetScale**: [planetscale.com](https://planetscale.com)
- **Supabase**: [supabase.com](https://supabase.com)
- **Railway**: [railway.app](https://railway.app)

### Step 3: Run Database Migrations

After setting up your production database:

```powershell
# Update DATABASE_URL in your .env file
# Then run migrations
npx prisma migrate deploy

# Or if using Vercel Postgres, you can run migrations via Vercel CLI:
vercel env pull .env.local
npx prisma migrate deploy
```

### Step 4: Configure Custom Domain (Optional)

1. In Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Add your custom domain (e.g., `honorable.ai`)
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` environment variable

---

## Part 5: Continuous Deployment Setup

### Automatic Deployments

Once connected to GitHub, Vercel will automatically:
- ✅ Deploy on every push to `main` branch
- ✅ Create preview deployments for pull requests
- ✅ Rebuild on environment variable changes

### Manual Deployment

If you need to manually trigger a deployment:
```powershell
vercel --prod
```

---

## Troubleshooting

### Build Fails on Vercel

1. **Check Build Logs**
   - Go to Vercel Dashboard → Your Project → **Deployments**
   - Click on the failed deployment
   - Review the build logs

2. **Common Issues**:
   - Missing environment variables
   - Database connection issues
   - Build timeout (increase in project settings)
   - Memory limits (upgrade plan if needed)

### Database Connection Issues

- Make sure `DATABASE_URL` is set correctly
- For Vercel Postgres, use the connection string from Storage tab
- For external databases, ensure they allow connections from Vercel IPs

### Environment Variables Not Working

- Make sure variables are set for **Production** environment
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

---

## Quick Reference Commands

```powershell
# Git commands
git status                    # Check status
git add .                     # Stage all changes
git commit -m "message"       # Commit changes
git push origin main          # Push to GitHub

# Vercel commands
vercel login                  # Login to Vercel
vercel                        # Deploy to preview
vercel --prod                 # Deploy to production
vercel env pull .env.local    # Pull environment variables
vercel logs                   # View deployment logs

# Database commands
npx prisma migrate deploy     # Run migrations in production
npx prisma generate           # Regenerate Prisma client
npx prisma studio             # Open database GUI
```

---

## Next Steps After Deployment

1. ✅ Test your live site
2. ✅ Set up monitoring (Vercel Analytics)
3. ✅ Configure error tracking (Sentry, etc.)
4. ✅ Set up backups for your database
5. ✅ Review and optimize performance
6. ✅ Set up staging environment (optional)

---

## Support Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **GitHub Docs**: [docs.github.com](https://docs.github.com)
- **Next.js Deployment**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- **Prisma Deployment**: [prisma.io/docs/guides/deployment](https://www.prisma.io/docs/guides/deployment)

---

**Ready to deploy? Start with Part 1 and work through each section step by step!**






