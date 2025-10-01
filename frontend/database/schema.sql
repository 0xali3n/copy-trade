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

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own data
CREATE POLICY "Allow users to view their own data"
ON public.users FOR SELECT
USING (true);

-- Policy for users to insert their own data
CREATE POLICY "Allow users to insert their own data"
ON public.users FOR INSERT
WITH CHECK (true);

-- Policy for users to update their own data
CREATE POLICY "Allow users to update their own data"
ON public.users FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow anonymous access for wallet-based auth
CREATE POLICY "Allow anonymous access for wallet auth"
ON public.users FOR ALL
TO anon
USING (true)
WITH CHECK (true);
