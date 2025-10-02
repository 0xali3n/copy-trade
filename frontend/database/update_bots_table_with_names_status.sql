-- Update copy_trading_bots table to include bot_name and status
-- This will add professional features while keeping it simple

-- Drop existing table completely
DROP TABLE IF EXISTS copy_trading_bots CASCADE;

-- Create the enhanced table with bot names and status
CREATE TABLE copy_trading_bots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address TEXT NOT NULL,  -- User's wallet address
  target_address TEXT NOT NULL,  -- Target wallet address to copy
  bot_name TEXT,  -- Custom bot name (optional)
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_copy_trading_bots_user_address ON copy_trading_bots(user_address);
CREATE INDEX idx_copy_trading_bots_target_address ON copy_trading_bots(target_address);
CREATE INDEX idx_copy_trading_bots_status ON copy_trading_bots(status);

-- Grant permissions to all roles
GRANT ALL ON copy_trading_bots TO authenticated;
GRANT ALL ON copy_trading_bots TO service_role;
GRANT ALL ON copy_trading_bots TO anon;

-- Enable RLS
ALTER TABLE copy_trading_bots ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for testing
CREATE POLICY "Allow all operations for authenticated users" ON copy_trading_bots
  FOR ALL USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_copy_trading_bots_updated_at 
  BEFORE UPDATE ON copy_trading_bots 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
