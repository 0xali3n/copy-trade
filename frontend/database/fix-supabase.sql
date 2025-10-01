-- Drop the existing table if it exists
DROP TABLE IF EXISTS public.users;

-- Create a simple users table
CREATE TABLE public.users (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  wallet_name TEXT,
  aptos_wallet_address TEXT,
  aptos_public_key TEXT,
  aptos_private_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS completely for now (simple approach)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to anon role
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.users TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO authenticated;
