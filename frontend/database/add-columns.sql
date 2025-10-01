-- Add the missing columns to the users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS aptos_public_key TEXT,
ADD COLUMN IF NOT EXISTS aptos_private_key TEXT;
