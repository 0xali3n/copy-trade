-- Copy Trading Trades Table
-- This table stores all copy trading transactions for each user

CREATE TABLE IF NOT EXISTS copy_trading_trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- User information
    user_wallet_address TEXT NOT NULL,
    bot_id UUID REFERENCES copy_trading_bots(id) ON DELETE CASCADE,
    
    -- Trade details
    symbol TEXT NOT NULL, -- e.g., "BTC-USD", "ETH-USD"
    market_id TEXT NOT NULL, -- e.g., "15", "16"
    action TEXT NOT NULL, -- "BUY", "SELL", "EXIT_LONG", "EXIT_SHORT"
    order_type TEXT NOT NULL, -- "MARKET", "LIMIT", "STOP"
    leverage INTEGER NOT NULL, -- e.g., 5, 10, 20
    price DECIMAL(20,8) NOT NULL, -- Trade price
    quantity DECIMAL(20,8) NOT NULL, -- Trade quantity/size
    
    -- Transaction details
    transaction_hash TEXT, -- Aptos transaction hash
    order_id TEXT, -- Original order ID from target user
    target_address TEXT, -- Address of the target user being copied
    
    -- Status and timing
    status TEXT NOT NULL DEFAULT 'PENDING', -- "PENDING", "SUCCESS", "FAILED"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional metadata
    pnl DECIMAL(20,8) DEFAULT 0, -- Profit/Loss (calculated later)
    fees DECIMAL(20,8) DEFAULT 0, -- Trading fees paid
    
    -- Indexes for better performance
    CONSTRAINT valid_action CHECK (action IN ('BUY', 'SELL', 'EXIT_LONG', 'EXIT_SHORT')),
    CONSTRAINT valid_order_type CHECK (order_type IN ('MARKET', 'LIMIT', 'STOP')),
    CONSTRAINT valid_status CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    CONSTRAINT positive_leverage CHECK (leverage > 0),
    CONSTRAINT positive_price CHECK (price > 0),
    CONSTRAINT positive_quantity CHECK (quantity > 0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_copy_trading_trades_user_wallet ON copy_trading_trades(user_wallet_address);
CREATE INDEX IF NOT EXISTS idx_copy_trading_trades_bot_id ON copy_trading_trades(bot_id);
CREATE INDEX IF NOT EXISTS idx_copy_trading_trades_symbol ON copy_trading_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_copy_trading_trades_created_at ON copy_trading_trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_copy_trading_trades_status ON copy_trading_trades(status);
CREATE INDEX IF NOT EXISTS idx_copy_trading_trades_target_address ON copy_trading_trades(target_address);

-- Create a function to automatically update the updated_at timestamp
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

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON copy_trading_trades TO your_app_user;
-- GRANT USAGE ON SCHEMA public TO your_app_user;

-- Add comments for documentation
COMMENT ON TABLE copy_trading_trades IS 'Stores all copy trading transactions executed by users';
COMMENT ON COLUMN copy_trading_trades.user_wallet_address IS 'Wallet address of the user who executed the trade';
COMMENT ON COLUMN copy_trading_trades.bot_id IS 'ID of the copy trading bot that executed this trade';
COMMENT ON COLUMN copy_trading_trades.symbol IS 'Trading pair symbol (e.g., BTC-USD)';
COMMENT ON COLUMN copy_trading_trades.market_id IS 'Market ID from Kana Labs API';
COMMENT ON COLUMN copy_trading_trades.action IS 'Type of trade action (BUY, SELL, EXIT_LONG, EXIT_SHORT)';
COMMENT ON COLUMN copy_trading_trades.order_type IS 'Order execution type (MARKET, LIMIT, STOP)';
COMMENT ON COLUMN copy_trading_trades.leverage IS 'Leverage used for the trade';
COMMENT ON COLUMN copy_trading_trades.price IS 'Price at which the trade was executed';
COMMENT ON COLUMN copy_trading_trades.quantity IS 'Quantity/size of the trade';
COMMENT ON COLUMN copy_trading_trades.transaction_hash IS 'Aptos blockchain transaction hash';
COMMENT ON COLUMN copy_trading_trades.order_id IS 'Original order ID from the target user being copied';
COMMENT ON COLUMN copy_trading_trades.target_address IS 'Address of the target user being copied';
COMMENT ON COLUMN copy_trading_trades.status IS 'Current status of the trade (PENDING, SUCCESS, FAILED)';
COMMENT ON COLUMN copy_trading_trades.pnl IS 'Profit/Loss from this trade (calculated later)';
COMMENT ON COLUMN copy_trading_trades.fees IS 'Trading fees paid for this trade';
