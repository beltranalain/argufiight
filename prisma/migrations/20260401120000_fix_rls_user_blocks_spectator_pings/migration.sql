-- Fix Supabase Security Advisor warnings: RLS disabled on user_blocks and spectator_pings.
-- These tables were created after the initial RLS migration ran.
-- Prisma connects as 'postgres' (BYPASSRLS) — unaffected.

ALTER TABLE IF EXISTS public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.spectator_pings ENABLE ROW LEVEL SECURITY;
