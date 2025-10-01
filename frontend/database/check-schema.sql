-- Check if the wallet columns exist in the users table
-- Run this in your Supabase SQL Editor to verify the schema

-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY column_name;

-- Check if wallet columns exist
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'aptos_wallet_address'
    AND table_schema = 'public'
  ) THEN 'EXISTS' ELSE 'MISSING' END as aptos_wallet_address_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'aptos_public_key'
    AND table_schema = 'public'
  ) THEN 'EXISTS' ELSE 'MISSING' END as aptos_public_key_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'aptos_private_key'
    AND table_schema = 'public'
  ) THEN 'EXISTS' ELSE 'MISSING' END as aptos_private_key_status;

-- Show current user count
SELECT COUNT(*) as total_users FROM public.users;

-- Show users with wallet data
SELECT 
  id, 
  email, 
  CASE WHEN aptos_wallet_address IS NOT NULL THEN 'HAS_WALLET' ELSE 'NO_WALLET' END as wallet_status,
  aptos_wallet_address
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;
