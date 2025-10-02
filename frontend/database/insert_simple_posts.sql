-- Create 5 realistic crypto influencer users with their posts
-- This approach creates actual users and posts in their names

-- First, let's clear any existing sample posts (optional)
-- DELETE FROM posts WHERE content LIKE '%WHALE ALERT%' OR content LIKE '%S2F model%' OR content LIKE '%market rewards patience%';

-- Create 5 crypto influencer users with real profile pictures
INSERT INTO users (id, email, full_name, avatar_url, aptos_wallet_address, aptos_public_key, aptos_private_key, twitter_username, created_at) VALUES
-- 1. Whale Alert (famous whale tracking account)
('11111111-1111-1111-1111-111111111111', 'whale@example.com', 'Whale Alert', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=face', '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12', '0x1234567890abcdef', '0xabcdef1234567890', 'whale_alert', NOW() - INTERVAL '30 days'),

-- 2. CryptoWendyO (famous female crypto trader)
('22222222-2222-2222-2222-222222222222', 'wendy@example.com', 'CryptoWendyO', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face', '0x2b3c4d5e6f7890abcdef1234567890abcdef1234', '0x2345678901bcdef0', '0xbcdef01234567890', 'CryptoWendyO', NOW() - INTERVAL '25 days'),

-- 3. PlanB (famous Bitcoin analyst)
('33333333-3333-3333-3333-333333333333', 'planb@example.com', 'PlanB', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face', '0x3c4d5e6f7890abcdef1234567890abcdef123456', '0x3456789012cdef01', '0xcdef012345678901', '100trillionUSD', NOW() - INTERVAL '20 days'),

-- 4. CryptoCred (technical analysis expert)
('44444444-4444-4444-4444-444444444444', 'cred@example.com', 'CryptoCred', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face', '0x4d5e6f7890abcdef1234567890abcdef12345678', '0x4567890123def012', '0xdef0123456789012', 'CryptoCred', NOW() - INTERVAL '15 days'),

-- 5. CryptoBirb (meme account with good analysis)
('55555555-5555-5555-5555-555555555555', 'birb@example.com', 'CryptoBirb', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face', '0x5e6f7890abcdef1234567890abcdef1234567890', '0x5678901234ef0123', '0xef01234567890123', 'CryptoBirb', NOW() - INTERVAL '10 days');

-- Now create posts for each user

-- Post 1: Whale Alert - Large BTC Transfer (Image Post)
INSERT INTO posts (
  user_id,
  content,
  post_type,
  image_url
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '🐋 WHALE ALERT: 1,500 BTC ($65M) transferred from unknown wallet to Binance. This could indicate selling pressure. Keep an eye on BTC price action! #WhaleAlert #BTC',
  'image',
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=400&fit=crop&crop=center'
);

-- Post 2: CryptoWendyO - Trade Analysis (Trade Post)
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
  '22222222-2222-2222-2222-222222222222',
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

-- Post 3: PlanB - Bitcoin Prediction (Poll Post)
INSERT INTO posts (
  user_id,
  content,
  post_type,
  poll_question,
  poll_options,
  poll_total_votes
) VALUES (
  '33333333-3333-3333-3333-333333333333',
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

-- Post 4: CryptoCred - Technical Analysis (Image Post with Chart)
INSERT INTO posts (
  user_id,
  content,
  post_type,
  image_url
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  '📊 BTC Daily Chart Analysis: We''re testing the key support at $42,800. If this holds, we could see a bounce to $44,500. However, if we break below $42,000, expect a move to $40,000. Volume is decreasing which suggests consolidation. #BTC #TechnicalAnalysis',
  'image',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop&crop=center'
);

-- Post 5: CryptoBirb - Market Sentiment (Regular Post)
INSERT INTO posts (
  user_id,
  content,
  post_type
) VALUES (
  '55555555-5555-5555-5555-555555555555',
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
