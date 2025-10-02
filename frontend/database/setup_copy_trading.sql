-- Simple Copy Trading Database Setup
-- Run this in Supabase SQL Editor

-- Drop existing tables if they exist
DROP TABLE IF EXISTS copy_trading_bots CASCADE;
DROP TABLE IF EXISTS target_wallets CASCADE;

-- Create target_wallets table
CREATE TABLE target_wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_address TEXT NOT NULL UNIQUE,
    profile_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_detected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    total_copiers INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create copy_trading_bots table
CREATE TABLE copy_trading_bots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    target_wallet_id UUID REFERENCES target_wallets(id) ON DELETE CASCADE NOT NULL,
    bot_name TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
    copy_size_multiplier DECIMAL(10,4) DEFAULT 1.0,
    min_copy_size DECIMAL(20,8) DEFAULT 0.0001,
    max_copy_size DECIMAL(20,8) DEFAULT 0.001,
    copy_trading_enabled BOOLEAN DEFAULT TRUE,
    total_trades INTEGER DEFAULT 0,
    successful_trades INTEGER DEFAULT 0,
    failed_trades INTEGER DEFAULT 0,
    total_pnl DECIMAL(20,8) DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_trade_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE target_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE copy_trading_bots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for target_wallets
CREATE POLICY "Allow authenticated users to view target wallets" ON target_wallets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert target wallets" ON target_wallets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update target wallets" ON target_wallets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete target wallets" ON target_wallets FOR DELETE TO authenticated USING (true);

-- RLS Policies for copy_trading_bots
CREATE POLICY "Allow authenticated users to view their own bots" ON copy_trading_bots FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to insert their own bots" ON copy_trading_bots FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to update their own bots" ON copy_trading_bots FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to delete their own bots" ON copy_trading_bots FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Function to update total_copiers count
CREATE OR REPLACE FUNCTION update_total_copiers()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE target_wallets
    SET total_copiers = total_copiers + 1
    WHERE id = NEW.target_wallet_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE target_wallets
    SET total_copiers = total_copiers - 1
    WHERE id = OLD.target_wallet_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for total_copiers count
CREATE TRIGGER update_total_copiers_trigger
AFTER INSERT OR DELETE ON copy_trading_bots
FOR EACH ROW EXECUTE FUNCTION update_total_copiers();

-- Set up user_id automatically on insert for copy_trading_bots
ALTER TABLE copy_trading_bots ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Update updated_at columns automatically
CREATE EXTENSION IF NOT EXISTS moddatetime;

CREATE TRIGGER handle_updated_at_target_wallets BEFORE UPDATE ON target_wallets
  FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER handle_updated_at_copy_trading_bots BEFORE UPDATE ON copy_trading_bots
  FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

-- Success message
SELECT 'Copy trading tables created successfully!' as result;
