# Next Steps - PowerShell Commands

## ✅ What We Just Fixed

1. Updated `.env.local` to connect to Neon (not old Prisma)
2. Baselined all 19 migrations (marked as applied)
3. Generated Prisma Client

## 🚀 What To Do Now

### Step 1: Verify Everything is Working

Run these commands to verify:

```powershell
# Check migration status (should say "Database schema is up to date!")
npx prisma migrate status

# Generate Prisma Client (if needed)
npx prisma generate
```

### Step 2: Start Development Server

```powershell
# Start the Next.js development server
npm run dev
```

This will start your app at `http://localhost:3000`

### Step 3: Create Admin User (If Needed)

If you don't have an admin user yet:

```powershell
# Create an admin user
npx tsx scripts/create-admin.ts
```

Follow the prompts to create your admin account.

### Step 4: Test the Application

1. **Open browser:** Go to `http://localhost:3000`
2. **Login:** Use your admin credentials
3. **Check Admin Dashboard:**
   - Go to `/admin` 
   - Verify you can see:
     - Platform Ads (`/admin/platform-ads`)
     - Creator Marketplace (`/admin/creator-marketplace`)
     - Promo Codes (`/admin/subscriptions/promo-codes`)
     - Settings with Advertising toggles (`/admin/settings`)

## 🔍 Quick Verification Commands

Run these to verify everything:

```powershell
# 1. Check database connection
npx prisma migrate status

# 2. Check if Prisma Client is generated
Test-Path node_modules/@prisma/client

# 3. Check if .env.local has correct values
Get-Content .env.local | Select-String "DATABASE_URL|DIRECT_URL"
```

## ⚠️ If Something Doesn't Work

### If you get "Can't reach database server"

Check your `.env.local` file:
```powershell
Get-Content .env.local | Select-String "DATABASE_URL"
```

Should show Neon URL (not `db.prisma.io`)

### If you get "Migration not found" errors

All migrations are already baselined, so this shouldn't happen. But if it does:
```powershell
npx prisma migrate status
```

Should show "Database schema is up to date!"

### If Prisma Client errors

Regenerate it:
```powershell
npx prisma generate
```

## 📋 Complete Checklist

- [ ] Run `npx prisma migrate status` - Should say "up to date"
- [ ] Run `npx prisma generate` - Should complete successfully
- [ ] Run `npm run dev` - Server should start
- [ ] Open `http://localhost:3000` - App should load
- [ ] Login to admin dashboard - Should work
- [ ] Check `/admin/platform-ads` - Should load
- [ ] Check `/admin/creator-marketplace` - Should load
- [ ] Check `/admin/subscriptions/promo-codes` - Should load

## 🎯 Most Important Commands

**Just run these 3 commands:**

```powershell
# 1. Verify database
npx prisma migrate status

# 2. Start server
npm run dev

# 3. (Optional) Create admin if needed
npx tsx scripts/create-admin.ts
```

That's it! Everything should work now.

