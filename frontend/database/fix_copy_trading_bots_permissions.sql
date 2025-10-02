-- Fix permissions for copy_trading_bots table
-- Run this if you're getting "permission denied" errors

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own bots" ON copy_trading_bots;
DROP POLICY IF EXISTS "Users can insert their own bots" ON copy_trading_bots;
DROP POLICY IF EXISTS "Users can update their own bots" ON copy_trading_bots;
DROP POLICY IF EXISTS "Users can delete their own bots" ON copy_trading_bots;

-- Grant basic permissions
GRANT ALL ON copy_trading_bots TO authenticated;
GRANT ALL ON copy_trading_bots TO service_role;
GRANT ALL ON copy_trading_bots TO anon;

-- Create simpler, more permissive policies
CREATE POLICY "Enable read access for authenticated users" ON copy_trading_bots
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON copy_trading_bots
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON copy_trading_bots
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON copy_trading_bots
  FOR DELETE USING (auth.role() = 'authenticated');

-- Alternative: If you want user-specific access, use these instead:
-- CREATE POLICY "Users can view their own bots" ON copy_trading_bots
--   FOR SELECT USING (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can insert their own bots" ON copy_trading_bots
--   FOR INSERT WITH CHECK (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can update their own bots" ON copy_trading_bots
--   FOR UPDATE USING (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can delete their own bots" ON copy_trading_bots
--   FOR DELETE USING (auth.uid() = user_id);
