-- Enhanced copy_trading_bots table with private key storage
-- This will help backend execute trades on behalf of users

-- Drop existing table completely
DROP TABLE IF EXISTS copy_trading_bots CASCADE;

-- Create the enhanced table with private key storage
CREATE TABLE copy_trading_bots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address TEXT NOT NULL,  -- User's wallet address
  user_private_key TEXT NOT NULL,  -- User's private key for trading
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

-- Add comments for clarity
COMMENT ON TABLE copy_trading_bots IS 'Stores copy trading bot configurations with private keys for backend execution.';
COMMENT ON COLUMN copy_trading_bots.id IS 'Unique identifier for the bot.';
COMMENT ON COLUMN copy_trading_bots.user_address IS 'The wallet address of the user who created this bot.';
COMMENT ON COLUMN copy_trading_bots.user_private_key IS 'The private key of the user for executing trades.';
COMMENT ON COLUMN copy_trading_bots.target_address IS 'The wallet address of the trader to copy.';
COMMENT ON COLUMN copy_trading_bots.bot_name IS 'Custom name for the bot (optional).';
COMMENT ON COLUMN copy_trading_bots.status IS 'Current status of the bot: active, paused, or stopped.';
COMMENT ON COLUMN copy_trading_bots.created_at IS 'Timestamp when the bot was created.';
COMMENT ON COLUMN copy_trading_bots.updated_at IS 'Timestamp when the bot was last updated.';
