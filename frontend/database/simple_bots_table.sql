-- Super simple copy trading bots table
-- Only 2 fields: target_address and user_id

-- Drop existing table if it exists
DROP TABLE IF EXISTS copy_trading_bots CASCADE;

-- Create the simple table
CREATE TABLE copy_trading_bots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_copy_trading_bots_user_id ON copy_trading_bots(user_id);

-- Grant permissions to all roles
GRANT ALL ON copy_trading_bots TO authenticated;
GRANT ALL ON copy_trading_bots TO service_role;
GRANT ALL ON copy_trading_bots TO anon;

-- Enable RLS
ALTER TABLE copy_trading_bots ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for testing
CREATE POLICY "Allow all operations for authenticated users" ON copy_trading_bots
  FOR ALL USING (auth.role() = 'authenticated');
