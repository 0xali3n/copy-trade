-- First, completely drop the posts table if it exists
DROP TABLE IF EXISTS posts CASCADE;

-- Create a simple posts table without foreign key constraint first
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- Just store the user ID, no foreign key constraint for now
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

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

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
