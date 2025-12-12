# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project Name:** honorable-ai
   - **Database Password:** (save this securely!)
   - **Region:** Choose closest to you
5. Click "Create new project"
6. Wait for project to be ready (~2 minutes)

## Step 2: Get Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon/public key:** `eyJhbGc...`
   - **service_role key:** `eyJhbGc...` (keep secret!)

3. Go to **Settings** → **Database**
4. Copy connection string:
   - **Connection string:** `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

## Step 3: Configure Environment Variables

1. Copy `env.example` to `.env.local`:
   ```powershell
   Copy-Item env.example .env.local
   ```

2. Edit `.env.local` and fill in:
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
   DIRECT_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
   NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
   SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

## Step 4: Set Up Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. (Optional) Disable "Confirm email" for development
4. (Optional) Enable **Google** provider for OAuth:
   - Get OAuth credentials from Google Cloud Console
   - Add redirect URL: `http://localhost:3000/auth/callback`

## Step 5: Create Profiles Table

1. Go to **SQL Editor** in Supabase
2. Run this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  elo_rating INTEGER DEFAULT 1200,
  debates_won INTEGER DEFAULT 0,
  debates_lost INTEGER DEFAULT 0,
  debates_tied INTEGER DEFAULT 0,
  total_debates INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Step 6: Test Authentication

1. Start development server:
   ```powershell
   npm run dev
   ```

2. Go to `http://localhost:3000/login`
3. Try signing up with a new account
4. Check Supabase **Authentication** → **Users** to see the new user
5. Check **Table Editor** → **profiles** to see the auto-created profile

## Troubleshooting

### Profile not created automatically
- Check if trigger function exists
- Check Supabase logs for errors
- Verify RLS policies are set correctly

### Authentication errors
- Verify environment variables are correct
- Check `NEXT_PUBLIC_APP_URL` matches your local URL
- Ensure Supabase project is active

### Google OAuth not working
- Verify redirect URL is set correctly in Google Cloud Console
- Check redirect URL in Supabase matches exactly
- Ensure OAuth credentials are correct

## Next Steps

After Supabase is set up:
1. ✅ Authentication pages are ready
2. ✅ Profile auto-creation is configured
3. Ready for Phase 2: Database Schema





