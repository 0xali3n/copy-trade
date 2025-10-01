-- Create the users table
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address text NOT NULL UNIQUE,
  wallet_name text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  last_login timestamp with time zone,
  trading_settings jsonb DEFAULT '{}'::jsonb NOT NULL,
  profile_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  aptos_wallet_address text,
  aptos_public_key text,
  aptos_private_key text
);

-- Disable RLS for now (for testing)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
