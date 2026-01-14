# Fix Migration Issues - Campaign Payment Fields

## Problem
- Migration fails due to shadow database issues (P3006)
- Prisma generate fails due to file lock (EPERM)

## Solution: Manual SQL Migration

### Step 1: Stop the Dev Server
**IMPORTANT**: Stop your `npm run dev` server before running Prisma generate.

Press `Ctrl+C` in the terminal where the dev server is running.

### Step 2: Run the Manual SQL Migration

1. Open your **Neon Dashboard** (https://console.neon.tech)
2. Go to your database project
3. Click on **SQL Editor**
4. Copy and paste the contents of `scripts/add-campaign-payment-fields-manual.sql`
5. Click **Run** to execute the SQL

OR use psql:

```powershell
# Get your connection string from .env
# Then run:
psql "YOUR_DATABASE_URL" -f scripts/add-campaign-payment-fields-manual.sql
```

### Step 3: Regenerate Prisma Client

After stopping the dev server, run:

```powershell
npx prisma generate
```

### Step 4: Restart Dev Server

```powershell
npm run dev
```

## Verification

After running the SQL, you can verify the columns were added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
AND column_name IN ('payment_status', 'stripe_payment_id', 'paid_at');
```

You should see all three columns listed.

## Alternative: Mark Migration as Applied

If you want Prisma to know the migration is done:

```powershell
npx prisma migrate resolve --applied 20250101190000_add_belt_system
```

Then create a new migration for the payment fields:

```powershell
npx prisma migrate dev --create-only --name add_campaign_payment_fields
```

Then manually edit the migration file and run it.
