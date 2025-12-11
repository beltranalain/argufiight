# Deploy Plans Board to Production

## ✅ What Was Fixed

1. Database schema synced locally using `prisma db push`
2. Tables created: `boards`, `lists`, `cards`, `card_labels`
3. Prisma Client regenerated

## ⚠️ Production Database Still Needs Tables

The production database on Vercel still needs the tables. You have 2 options:

### Option 1: Run db push on Production (Easiest)

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm install -g vercel
   ```

2. **Pull production environment variables**:
   ```bash
   vercel env pull .env.production
   ```

3. **Run db push with production env**:
   ```bash
   # Windows PowerShell
   Get-Content .env.production | ForEach-Object { if ($_ -match '^([^=]+)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process') } }
   npx prisma db push --accept-data-loss
   ```

   Or manually set the DATABASE_URL and DIRECT_URL from Vercel dashboard, then:
   ```bash
   npx prisma db push --accept-data-loss
   ```

### Option 2: Delete Plans Feature (If Still Not Working)

If you can't get it working, I can delete the entire Plans board feature. Just let me know.

## Test After Deployment

1. Go to https://www.argufight.com/admin/plans
2. Try creating a board
3. If it works, you're done! ✅
4. If you still get 503 errors, the tables weren't created in production

---

**Note:** The `prisma db push` command I ran only affected your local database. Production needs the same command run with production environment variables.

