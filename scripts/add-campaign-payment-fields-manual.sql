-- Manual SQL script to add payment fields to campaigns table
-- Run this in your Neon Dashboard SQL Editor or via psql

-- Step 1: Add payment_status column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN payment_status VARCHAR(20);
        COMMENT ON COLUMN campaigns.payment_status IS 'PENDING, PAID, REFUNDED';
    END IF;
END $$;

-- Step 2: Add stripe_payment_id column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'stripe_payment_id'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN stripe_payment_id VARCHAR(255);
    END IF;
END $$;

-- Step 3: Add paid_at column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'paid_at'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN paid_at TIMESTAMP;
    END IF;
END $$;

-- Step 4: Add PENDING_PAYMENT to CampaignStatus enum (if it doesn't exist)
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

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
AND column_name IN ('payment_status', 'stripe_payment_id', 'paid_at')
ORDER BY column_name;

-- Verify enum values
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'CampaignStatus')
ORDER BY enumsortorder;
