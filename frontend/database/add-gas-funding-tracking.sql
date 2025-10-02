-- Add gas funding tracking to users table
-- Run this in Supabase SQL Editor

-- Add gas_funded column to track if wallet has been funded
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS gas_funded boolean DEFAULT false;

-- Add aptos_wallet_address column if it doesn't exist (for consistency)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS aptos_wallet_address text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_aptos_wallet_address 
ON public.users(aptos_wallet_address);

CREATE INDEX IF NOT EXISTS idx_users_gas_funded 
ON public.users(gas_funded);

-- Update existing users to have gas_funded = false
UPDATE public.users 
SET gas_funded = false 
WHERE gas_funded IS NULL;

-- Test the changes
SELECT 
  id, 
  email, 
  aptos_wallet_address, 
  gas_funded,
  created_at
FROM public.users 
LIMIT 5;

SELECT 'Gas funding tracking added successfully!' as status;
