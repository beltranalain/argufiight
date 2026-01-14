-- Manual SQL migration for advertiser fields
-- Run this in your Neon database dashboard if Prisma migration fails

-- Add new columns to advertisers table
ALTER TABLE advertisers 
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS company_size TEXT,
ADD COLUMN IF NOT EXISTS monthly_ad_budget TEXT,
ADD COLUMN IF NOT EXISTS marketing_goals TEXT;

-- Add comments for documentation
COMMENT ON COLUMN advertisers.contact_phone IS 'Contact phone number for advertiser';
COMMENT ON COLUMN advertisers.company_size IS 'Company size: SOLO, SMALL, MEDIUM, LARGE, ENTERPRISE';
COMMENT ON COLUMN advertisers.monthly_ad_budget IS 'Monthly ad budget range';
COMMENT ON COLUMN advertisers.marketing_goals IS 'Marketing goals and objectives';
