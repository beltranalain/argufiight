# Manual Migration Instructions

## Problem
Prisma migration is failing due to shadow database issues with Neon PostgreSQL.

## Solution: Manual SQL Migration

### Step 1: Run SQL in Neon Dashboard

1. Go to [Neon Console](https://console.neon.tech)
2. Select your database: `neondb`
3. Click **"SQL Editor"**
4. Copy and paste this SQL:

```sql
-- Add paymentStatus column
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50);

-- Add stripePaymentId column
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS stripe_payment_id VARCHAR(255);

-- Add paidAt column
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- Add PENDING_PAYMENT to CampaignStatus enum (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'PENDING_PAYMENT' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'CampaignStatus')
    ) THEN
        ALTER TYPE "CampaignStatus" ADD VALUE 'PENDING_PAYMENT';
    END IF;
END $$;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
AND column_name IN ('payment_status', 'stripe_payment_id', 'paid_at');
```

5. Click **"Run"** to execute
6. You should see the verification query results showing the 3 new columns

### Step 2: Mark Migration as Applied

After SQL runs successfully, run these commands in your terminal:

```powershell
# Mark the migration as applied (without actually running it)
npx prisma migrate resolve --applied add_campaign_payment

# Generate Prisma client with new fields
npx prisma generate
```

### Step 3: Verify

Check that the migration was marked as applied:

```powershell
npx prisma migrate status
```

You should see `add_campaign_payment` listed as applied.

---

## Alternative: Use Prisma Studio to Verify

```powershell
npx prisma studio
```

Navigate to the `Campaign` model and check that the new fields appear:
- `paymentStatus`
- `stripePaymentId`
- `paidAt`

---

## Troubleshooting

### If SQL fails with "enum value already exists"
- The `PENDING_PAYMENT` value might already be in the enum
- Skip that part of the SQL and just run the ALTER TABLE statements

### If columns already exist
- The `IF NOT EXISTS` clause will prevent errors
- Just mark the migration as applied

### If Prisma generate fails
- Make sure no Node processes are running
- Close all terminals
- Try again: `npx prisma generate`

---

## What This Does

This migration adds:
1. **paymentStatus** - Tracks if campaign is paid (PENDING, PAID, REFUNDED)
2. **stripePaymentId** - Stores Stripe payment intent ID
3. **paidAt** - Timestamp when payment was completed
4. **PENDING_PAYMENT** - New campaign status for unpaid campaigns

These fields enable the payment portal for Platform Ads campaigns.
