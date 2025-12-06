# Fix Local Database Connection

## Problem

When running `npx prisma migrate status`, you get:
```
Error: P1001: Can't reach database server at `db.prisma.io:5432`
```

This means your local `.env` file is still pointing to the **old Prisma Data Platform** database instead of **Neon**.

## Solution: Update Local .env File

### Step 1: Create/Update .env File

Create a `.env` file in the project root (or update existing one) with these values:

```env
# Neon Database Connection Strings
# For regular queries (with connection pooling)
DATABASE_URL=postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

# For migrations (without connection pooling)
DIRECT_URL=postgresql://neondb_owner:npg_iHJCQOqk73jN@ep-long-math-a4am11rd.us-east-1.aws.neon.tech/neondb?sslmode=require

# Authentication
AUTH_SECRET=344e11ac0b8d530be37625647772982874d10989a3d640452c9f16ac5125b837

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_dvwKczTLQ7v3F9UK_M1OR2yN9wAy6BAAXumTPpo6S09kKxA

# AI API Keys
DEEPSEEK_API_KEY=sk-2b74f7dbee0e429f87a56f167de005c1
```

### Step 2: Verify Connection

After updating `.env`, test the connection:

```bash
# Check migration status
npx prisma migrate status

# Or test connection
npx prisma db pull
```

### Step 3: Run Migrations (If Needed)

If migrations haven't been applied to Neon:

```bash
# Deploy all pending migrations
npx prisma migrate deploy

# Or for development (creates new migration if schema changed)
npx prisma migrate dev
```

## Important Notes

1. **Never commit `.env` to git** - It contains sensitive credentials
2. **Use `Import.env.txt` as reference** - This file has the correct values
3. **Both `DATABASE_URL` and `DIRECT_URL` are required** - Prisma needs both
4. **`DATABASE_URL` uses `-pooler`** - For regular queries (connection pooling)
5. **`DIRECT_URL` does NOT use `-pooler`** - For migrations (direct connection)

## Quick Fix Command

If you want to quickly create the `.env` file from `Import.env.txt`:

**Windows PowerShell:**
```powershell
# Copy Import.env.txt to .env and fix format
Get-Content Import.env.txt | ForEach-Object { $_ -replace '^([^:]+):\s*(.+)$', '$1=$2' } | Set-Content .env
```

**Or manually:**
1. Open `Import.env.txt`
2. Copy the connection strings
3. Create `.env` file
4. Change format from `KEY: value` to `KEY=value`
5. Save

## Verify It's Working

After updating `.env`:

```bash
# Should connect to Neon, not db.prisma.io
npx prisma migrate status
```

You should see:
- ✅ Connection successful
- ✅ Migration status (applied/pending)
- ❌ No more "Can't reach database server at `db.prisma.io:5432`"

