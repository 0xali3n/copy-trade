-- Simple Database Setup - Just the basics
-- Run this in Supabase SQL Editor

-- Step 1: Drop everything first
DROP TABLE IF EXISTS public.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 2: Create simple users table
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  google_id text UNIQUE,
  aptos_public_key text,
  aptos_private_key text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  last_login timestamp with time zone DEFAULT now()
);

-- Step 3: Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple policies (allow everything for now)
CREATE POLICY "Enable all for authenticated users"
ON public.users FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all for anon users"
ON public.users FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Step 5: Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.users TO service_role;

-- Step 6: Test
SELECT 'Simple database setup completed! Ready for new users.' as status;
