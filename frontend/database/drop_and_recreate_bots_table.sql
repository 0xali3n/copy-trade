-- Drop current bots table and recreate with user wallet address
-- This will store: target_address and user_address (user's wallet address)

-- Drop existing table completely
DROP TABLE IF EXISTS copy_trading_bots CASCADE;

-- Create the new simple table with user wallet address
CREATE TABLE copy_trading_bots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address TEXT NOT NULL,  -- User's wallet address
  target_address TEXT NOT NULL,  -- Target wallet address to copy
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_copy_trading_bots_user_address ON copy_trading_bots(user_address);
CREATE INDEX idx_copy_trading_bots_target_address ON copy_trading_bots(target_address);

-- Grant permissions to all roles
GRANT ALL ON copy_trading_bots TO authenticated;
GRANT ALL ON copy_trading_bots TO service_role;
GRANT ALL ON copy_trading_bots TO anon;

-- Enable RLS
ALTER TABLE copy_trading_bots ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for testing
CREATE POLICY "Allow all operations for authenticated users" ON copy_trading_bots
  FOR ALL USING (auth.role() = 'authenticated');
