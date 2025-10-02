-- User Settings Table Schema
-- This table stores user profile settings and preferences

CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Profile Information
    display_name VARCHAR(100),
    profile_image_url TEXT,
    bio TEXT,
    
    -- Social Connections
    twitter_username VARCHAR(50),
    twitter_connected BOOLEAN DEFAULT FALSE,
    twitter_user_id VARCHAR(50),
    
    -- Wallet Information (encrypted)
    wallet_address TEXT,
    private_key_encrypted TEXT, -- Store encrypted private key
    
    -- Preferences
    theme VARCHAR(20) DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_twitter_username ON user_settings(twitter_username);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings for existing users
INSERT INTO user_settings (user_id, display_name, theme, notifications_enabled, email_notifications)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'Trader'),
    'light',
    TRUE,
    TRUE
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM user_settings)
ON CONFLICT (user_id) DO NOTHING;
