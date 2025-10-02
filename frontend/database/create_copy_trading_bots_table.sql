-- Create a simple copy_trading_bots table
-- This table stores all copy trading bot information in one place

CREATE TABLE IF NOT EXISTS copy_trading_bots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_copy_trading_bots_user_id ON copy_trading_bots(user_id);
CREATE INDEX IF NOT EXISTS idx_copy_trading_bots_target_address ON copy_trading_bots(target_address);
CREATE INDEX IF NOT EXISTS idx_copy_trading_bots_status ON copy_trading_bots(status);

-- Enable Row Level Security (RLS)
ALTER TABLE copy_trading_bots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see and modify their own bots
CREATE POLICY "Users can view their own bots" ON copy_trading_bots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bots" ON copy_trading_bots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bots" ON copy_trading_bots
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bots" ON copy_trading_bots
  FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT ALL ON copy_trading_bots TO authenticated;
GRANT ALL ON copy_trading_bots TO service_role;

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_copy_trading_bots_updated_at 
  BEFORE UPDATE ON copy_trading_bots 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add some sample data for testing (optional)
-- INSERT INTO copy_trading_bots (user_id, bot_name, target_address, status) 
-- VALUES 
--   ('your-user-id-here', 'Test Bot 1', '0x1234567890abcdef1234567890abcdef12345678', 'active'),
--   ('your-user-id-here', 'Test Bot 2', '0xabcdef1234567890abcdef1234567890abcdef12', 'paused');
