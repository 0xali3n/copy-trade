-- Simple copy_trading_bots table creation
-- This version should work without permission issues

-- Drop table if it exists (for testing)
DROP TABLE IF EXISTS copy_trading_bots CASCADE;

-- Create the table
CREATE TABLE copy_trading_bots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bot_name TEXT NOT NULL,
  target_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
  copy_size_multiplier DECIMAL(10,4) DEFAULT 1.0,
  min_copy_size DECIMAL(20,8) DEFAULT 0.0001,
  max_copy_size DECIMAL(20,8) DEFAULT 0.001,
  copy_trading_enabled BOOLEAN DEFAULT true,
  total_trades INTEGER DEFAULT 0,
  successful_trades INTEGER DEFAULT 0,
  failed_trades INTEGER DEFAULT 0,
  total_pnl DECIMAL(20,8) DEFAULT 0.0,
  win_rate DECIMAL(5,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_trade_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_copy_trading_bots_user_id ON copy_trading_bots(user_id);
CREATE INDEX idx_copy_trading_bots_target_address ON copy_trading_bots(target_address);
CREATE INDEX idx_copy_trading_bots_status ON copy_trading_bots(status);

-- Grant permissions to all roles
GRANT ALL ON copy_trading_bots TO authenticated;
GRANT ALL ON copy_trading_bots TO service_role;
GRANT ALL ON copy_trading_bots TO anon;

-- Enable RLS
ALTER TABLE copy_trading_bots ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (for testing - you can make them more restrictive later)
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
