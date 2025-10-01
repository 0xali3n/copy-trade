-- Add missing wallet columns to the users table
-- Run this in your Supabase SQL Editor

-- Check if columns already exist before adding them
DO $$ 
BEGIN
    -- Add aptos_wallet_address column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'aptos_wallet_address'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN aptos_wallet_address text;
        RAISE NOTICE 'Added aptos_wallet_address column';
    ELSE
        RAISE NOTICE 'aptos_wallet_address column already exists';
    END IF;

    -- Add aptos_public_key column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'aptos_public_key'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN aptos_public_key text;
        RAISE NOTICE 'Added aptos_public_key column';
    ELSE
        RAISE NOTICE 'aptos_public_key column already exists';
    END IF;

    -- Add aptos_private_key column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'aptos_private_key'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN aptos_private_key text;
        RAISE NOTICE 'Added aptos_private_key column';
    ELSE
        RAISE NOTICE 'aptos_private_key column already exists';
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name LIKE 'aptos_%'
ORDER BY column_name;

-- Show success message
SELECT 'Wallet columns added successfully! Ready for Aptos wallet creation.' as status;
