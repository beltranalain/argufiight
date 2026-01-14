-- Manual migration script to add payment fields to campaigns table
-- Run this if Prisma migration fails

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
-- Note: You may need to check if this enum value already exists
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
