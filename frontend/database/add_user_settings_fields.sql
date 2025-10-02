-- Add new fields to existing users table for settings functionality
-- This extends your current table instead of creating a new one

-- Add new columns to the existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_username VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_user_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'light';
ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS settings_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing users with default display_name from full_name if display_name is null
UPDATE users 
SET display_name = COALESCE(full_name, 'Trader')
WHERE display_name IS NULL;

-- Create index for better performance on new fields
CREATE INDEX IF NOT EXISTS idx_users_twitter_username ON users(twitter_username);
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);

-- Create trigger to update settings_updated_at when settings fields change
CREATE OR REPLACE FUNCTION update_user_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if settings-related fields changed
    IF (OLD.display_name IS DISTINCT FROM NEW.display_name) OR
       (OLD.bio IS DISTINCT FROM NEW.bio) OR
       (OLD.twitter_username IS DISTINCT FROM NEW.twitter_username) OR
       (OLD.twitter_connected IS DISTINCT FROM NEW.twitter_connected) OR
       (OLD.theme IS DISTINCT FROM NEW.theme) OR
       (OLD.notifications_enabled IS DISTINCT FROM NEW.notifications_enabled) OR
       (OLD.email_notifications IS DISTINCT FROM NEW.email_notifications) THEN
        NEW.settings_updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for the users table
DROP TRIGGER IF EXISTS update_users_settings_timestamp ON users;
CREATE TRIGGER update_users_settings_timestamp 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_user_settings_timestamp();

-- Add comments to document the new fields
COMMENT ON COLUMN users.display_name IS 'User-defined display name (editable)';
COMMENT ON COLUMN users.bio IS 'User bio/description';
COMMENT ON COLUMN users.twitter_username IS 'Twitter username for social connection';
COMMENT ON COLUMN users.twitter_connected IS 'Whether Twitter account is connected';
COMMENT ON COLUMN users.twitter_user_id IS 'Twitter user ID from OAuth';
COMMENT ON COLUMN users.theme IS 'User theme preference (light/dark)';
COMMENT ON COLUMN users.notifications_enabled IS 'Whether user wants notifications';
COMMENT ON COLUMN users.email_notifications IS 'Whether user wants email notifications';
COMMENT ON COLUMN users.settings_updated_at IS 'Last time settings were updated';
