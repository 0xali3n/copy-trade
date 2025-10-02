-- Ultra Simple Copy Trading Trades Table (No Security Policies)
-- This table stores all copy trading transactions for each user

-- Drop table if exists (for easy recreation)
DROP TABLE IF EXISTS copy_trading_trades CASCADE;

-- Create the table
CREATE TABLE copy_trading_trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- User information
    user_wallet_address TEXT NOT NULL,
    bot_id UUID,
    
    -- Trade details
    symbol TEXT NOT NULL,
    market_id TEXT NOT NULL,
    action TEXT NOT NULL,
    order_type TEXT NOT NULL,
    leverage INTEGER NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    quantity DECIMAL(20,8) NOT NULL,
    
    -- Transaction details
    transaction_hash TEXT,
    order_id TEXT,
    target_address TEXT,
    
    -- Status and timing
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional metadata
    pnl DECIMAL(20,8) DEFAULT 0,
    fees DECIMAL(20,8) DEFAULT 0
);

-- Create basic indexes for performance
CREATE INDEX idx_copy_trading_trades_user_wallet ON copy_trading_trades(user_wallet_address);
CREATE INDEX idx_copy_trading_trades_bot_id ON copy_trading_trades(bot_id);
CREATE INDEX idx_copy_trading_trades_created_at ON copy_trading_trades(created_at DESC);

-- Create a simple function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_copy_trading_trades_updated_at 
    BEFORE UPDATE ON copy_trading_trades 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- NO ROW LEVEL SECURITY - Allow all operations
-- This makes it super simple for development and testing

-- Grant all permissions to everyone (for development)
GRANT ALL ON copy_trading_trades TO PUBLIC;
GRANT USAGE ON SCHEMA public TO PUBLIC;
