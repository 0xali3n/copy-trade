-- First, completely drop the posts table if it exists
DROP TABLE IF EXISTS posts CASCADE;

-- Create a simple posts table without RLS for testing
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  post_type VARCHAR(20) DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'trade', 'poll')),
  
  -- Trade specific fields
  trade_symbol VARCHAR(20),
  trade_side VARCHAR(10) CHECK (trade_side IN ('long', 'short')),
  trade_leverage INTEGER,
  trade_entry_price DECIMAL(20,8),
  trade_quantity DECIMAL(20,8),
  trade_status VARCHAR(10) CHECK (trade_status IN ('open', 'closed')),
  trade_closing_price DECIMAL(20,8),
  
  -- Poll specific fields
  poll_question TEXT,
  poll_options JSONB,
  poll_total_votes INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- DON'T enable RLS for now - let's test without it first
-- ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_posts_updated_at 
  BEFORE UPDATE ON posts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to authenticated users
GRANT ALL ON posts TO authenticated;
GRANT ALL ON posts TO anon;
