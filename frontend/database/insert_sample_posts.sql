-- Insert initial sample posts from famous crypto Twitter accounts
-- These posts will show before anyone else posts
-- Using your existing user ID for all posts (no new users created)

-- Get your user ID first (replace with your actual email)
-- You can find your user ID by running: SELECT id, email, full_name FROM users;

-- Sample Post 1: Whale Alert - Large BTC Transfer (Image Post)
INSERT INTO posts (
  user_id,
  content,
  post_type,
  image_url
) VALUES (
  (SELECT id FROM users WHERE email = 'appcptr@gmail.com' LIMIT 1),
  '🐋 WHALE ALERT: 1,500 BTC ($65M) transferred from unknown wallet to Binance. This could indicate selling pressure. Keep an eye on BTC price action! #WhaleAlert #BTC',
  'image',
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=400&fit=crop&crop=center'
);

-- Sample Post 2: CryptoWendyO - Trade Analysis (Trade Post)
INSERT INTO posts (
  user_id,
  content,
  post_type,
  trade_symbol,
  trade_side,
  trade_leverage,
  trade_entry_price,
  trade_quantity,
  trade_status,
  trade_closing_price
) VALUES (
  (SELECT id FROM users WHERE email = 'appcptr@gmail.com' LIMIT 1),
  'Just closed my ETH long position! Entry: $2,650, Exit: $2,720. Made $700 profit with 3x leverage. The breakout above $2,700 resistance was beautiful! Next target: $2,800 🚀',
  'trade',
  'ETH/USDT',
  'long',
  3,
  2650.00,
  1000.00,
  'closed',
  2720.00
);

-- Sample Post 3: PlanB - Bitcoin Prediction (Poll Post)
INSERT INTO posts (
  user_id,
  content,
  post_type,
  poll_question,
  poll_options,
  poll_total_votes
) VALUES (
  (SELECT id FROM users WHERE email = 'appcptr@gmail.com' LIMIT 1),
  'Based on my S2F model, where do you think BTC will be by end of 2024? The model suggests $100K+ but market sentiment is mixed. What''s your prediction?',
  'poll',
  'Where will BTC be by end of 2024?',
  '[
    {"id": "1", "text": "Under $50K", "votes": 45},
    {"id": "2", "text": "$50K - $75K", "votes": 120},
    {"id": "3", "text": "$75K - $100K", "votes": 200},
    {"id": "4", "text": "Over $100K", "votes": 135}
  ]',
  500
);

-- Sample Post 4: CryptoCred - Technical Analysis (Image Post with Chart)
INSERT INTO posts (
  user_id,
  content,
  post_type,
  image_url
) VALUES (
  (SELECT id FROM users WHERE email = 'appcptr@gmail.com' LIMIT 1),
  '📊 BTC Daily Chart Analysis: We''re testing the key support at $42,800. If this holds, we could see a bounce to $44,500. However, if we break below $42,000, expect a move to $40,000. Volume is decreasing which suggests consolidation. #BTC #TechnicalAnalysis',
  'image',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop&crop=center'
);

-- Sample Post 5: CryptoBirb - Market Sentiment (Regular Post)
INSERT INTO posts (
  user_id,
  content,
  post_type
) VALUES (
  (SELECT id FROM users WHERE email = 'appcptr@gmail.com' LIMIT 1),
  '🐦 The market is showing classic signs of fear and greed. When everyone is panicking about a 5% drop, that''s usually when the best opportunities appear. Remember: the market rewards patience and punishes emotion. Stay calm, stick to your plan! #HODL #DiamondHands',
  'text'
);

-- Update the created_at timestamps to make them appear in chronological order
-- (Most recent first, going back in time)

UPDATE posts SET created_at = NOW() - INTERVAL '30 minutes' WHERE content LIKE '%market rewards patience%';
UPDATE posts SET created_at = NOW() - INTERVAL '1 hour' WHERE content LIKE '%BTC Daily Chart Analysis%';
UPDATE posts SET created_at = NOW() - INTERVAL '2 hours' WHERE content LIKE '%S2F model%';
UPDATE posts SET created_at = NOW() - INTERVAL '3 hours' WHERE content LIKE '%Just closed my ETH long%';
UPDATE posts SET created_at = NOW() - INTERVAL '4 hours' WHERE content LIKE '%WHALE ALERT%';
