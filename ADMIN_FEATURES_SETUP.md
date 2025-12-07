# Admin Features Setup Guide

## Issue
The following admin features are not showing data:
- Categories
- Content Manager
- Legal Pages
- AI Judges

## Root Cause
The database tables exist in the schema, but they may be:
1. **Not created** (migrations not run)
2. **Empty** (no seed data)

## Solution

### Step 1: Run Database Migrations

Make sure all migrations are applied:

```powershell
cd C:\Users\beltr\Honorable.AI

# Set environment variables
$env:DATABASE_URL="postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require"

# Run migrations
npx prisma migrate deploy
```

### Step 2: Seed Initial Data (Optional)

If the tables are empty, you may need to seed them. Check if there's a seed script:

```powershell
npm run seed
```

Or manually create initial data through the admin dashboard.

### Step 3: Verify Tables Exist

Check if the tables are created:

```powershell
# Connect to database and check tables
npx prisma studio
```

This will open Prisma Studio where you can see all tables and their data.

### Step 4: Test API Endpoints

Test if the API endpoints are working:

1. **Categories**: `https://honorable-ai.vercel.app/api/admin/categories`
2. **Content Manager**: `https://honorable-ai.vercel.app/api/admin/content/sections`
3. **Legal Pages**: `https://honorable-ai.vercel.app/api/admin/legal-pages`
4. **AI Judges**: `https://honorable-ai.vercel.app/api/admin/judges`

If you get 500 errors, check the Vercel logs.

## Quick Fix: Create Initial Data

If tables exist but are empty, you can create initial data:

### Categories
Go to `/admin/categories` and click "Add Category" to create categories.

### Content Manager
Go to `/admin/content` - sections should auto-create on first use, or you can add them.

### Legal Pages
Go to `/admin/legal` and create:
- Terms of Service (slug: `terms`)
- Privacy Policy (slug: `privacy`)

### AI Judges
Go to `/admin/judges` and click "Add Judge" to create AI judge personalities.

## Database Tables Required

- `categories` - Debate categories
- `homepage_sections` - Content manager sections
- `legal_pages` - Terms, Privacy, etc.
- `judges` - AI judge personalities

All these tables are defined in `prisma/schema.prisma` and should be created by migrations.



