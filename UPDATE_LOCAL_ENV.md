# Update Local .env File for Neon Database

## Problem
Your local `.env` file is still pointing to the old Prisma database (`db.prisma.io:5432`).

## Solution: Update Your Local .env File

### Step 1: Open Your .env File

Open the `.env` file in the root of your project (`C:\Users\beltr\Honorable.AI\.env`).

### Step 2: Update DATABASE_URL

Find this line:
```env
DATABASE_URL=postgres://...@db.prisma.io:5432/...
```

Replace it with:
```env
DATABASE_URL=postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Step 3: Update or Add DIRECT_URL

Find this line (if it exists):
```env
DIRECT_URL=...
```

Or add it if it doesn't exist:
```env
DIRECT_URL=postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Note:** `DIRECT_URL` is the same as `DATABASE_URL` but **without** `-pooler` in the hostname.

### Step 4: Remove Old Prisma Variables (Optional)

If you see these old variables, you can delete or comment them out:
```env
# POSTGRES_URL=postgres://...@db.prisma.io:5432/...  # Old, no longer needed
# PRISMA_DATABASE_URL=prisma+postgres://...  # Old, no longer needed
```

### Step 5: Verify Your .env File

Your `.env` file should now have:
```env
# Neon Database (REQUIRED)
DATABASE_URL=postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd.us-east-1.aws.neon.tech/neondb?sslmode=require

# Authentication
AUTH_SECRET=your-auth-secret-here

# Other variables...
```

### Step 6: Test the Connection

After updating, run:
```bash
npx prisma db push
```

This should now connect to Neon instead of the old Prisma database.

## Quick Copy-Paste

If you want to quickly update, replace your entire `DATABASE_URL` and `DIRECT_URL` lines with:

```env
DATABASE_URL=postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Troubleshooting

If you still get connection errors:

1. **Check the file was saved** - Make sure you saved the `.env` file
2. **Restart your terminal** - Environment variables are loaded when the terminal starts
3. **Check for typos** - Make sure there are no extra spaces or quotes
4. **Verify the connection string** - The format should be exactly as shown above

