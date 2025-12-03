# Fix Database Connection Error

## Problem
The app is trying to use SQLite instead of PostgreSQL on Vercel, causing "Unable to open the database file" errors.

## Solution
I've updated `package.json` to regenerate Prisma Client during the build. You need to:

1. **Commit and push the changes:**
   ```powershell
   git add package.json
   git commit -m "Add postinstall script to regenerate Prisma client for production"
   git push
   ```

2. **Redeploy on Vercel:**
   - Go to Vercel Dashboard → Deployments
   - Click the three dots (⋯) on the latest deployment
   - Click "Redeploy"

This will ensure Prisma Client is generated with the correct PostgreSQL connection during the build.

## What Changed
- Added `"postinstall": "prisma generate"` to run after npm install
- Updated `"build"` script to include `prisma generate` before building

This ensures Prisma Client is always generated with the correct database connection from environment variables.

