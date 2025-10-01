-- Quick Database Setup for Google Auth
-- Run this in Supabase SQL Editor

-- Step 1: Drop existing table if it exists
DROP TABLE IF EXISTS public.users CASCADE;

-- Step 2: Create users table
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  google_id text UNIQUE,
  aptos_wallet_address text,
  aptos_public_key text,
  aptos_private_key text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  last_login timestamp with time zone DEFAULT now(),
  trading_settings jsonb DEFAULT '{}'::jsonb NOT NULL,
  profile_data jsonb DEFAULT '{}'::jsonb NOT NULL
);

-- Step 3: Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple RLS policies (allow all for now)
CREATE POLICY "Allow all operations for authenticated users"
ON public.users FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Step 5: Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;

-- Step 6: Test the setup
SELECT 'Database setup completed successfully!' as status;
