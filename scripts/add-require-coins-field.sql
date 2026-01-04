-- Add require_coins_for_challenge field to belt_settings
ALTER TABLE "belt_settings" ADD COLUMN IF NOT EXISTS "require_coins_for_challenge" BOOLEAN NOT NULL DEFAULT true;
