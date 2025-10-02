# Database Setup for Copy Trading Bots

This directory contains the SQL scripts needed to set up the copy trading bot functionality.

## Quick Setup

### Option 1: Simple Setup (Recommended for testing)

1. **Go to your Supabase Dashboard**

   - Open your Supabase project
   - Go to the SQL Editor

2. **Run the Simple Table Creation Script**

   - Copy the contents of `simple_copy_trading_bots.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

3. **Verify the Table**
   - Go to Table Editor
   - You should see a new table called `copy_trading_bots`

### Option 2: If you already have the table but getting permission errors

1. **Run the Permission Fix Script**
   - Copy the contents of `fix_copy_trading_bots_permissions.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

### Option 3: Original Setup (if you want user-specific access)

1. **Run the Original Script**
   - Copy the contents of `create_copy_trading_bots_table.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

## What This Creates

The script creates a single table `copy_trading_bots` with:

- **Basic Bot Info**: `bot_name`, `target_address`, `status`
- **User Association**: `user_id` (links to auth.users)
- **Trading Settings**: `copy_size_multiplier`, `min_copy_size`, `max_copy_size`
- **Performance Tracking**: `total_trades`, `successful_trades`, `failed_trades`, `total_pnl`, `win_rate`
- **Timestamps**: `created_at`, `updated_at`, `last_trade_at`, `started_at`

## Security Features

- **Row Level Security (RLS)** enabled
- **Policies** ensure users can only see/modify their own bots
- **Automatic timestamps** with triggers

## Testing

After running the SQL script:

1. Go to your frontend dashboard
2. Try creating a bot with a target address
3. The bot should be saved to the database
4. You should see it in the dashboard list

## Troubleshooting

If you get errors:

1. **Permission errors**:
   - Try running `simple_copy_trading_bots.sql` (drops and recreates the table)
   - Or run `fix_copy_trading_bots_permissions.sql` to fix permissions
2. **Table already exists**: The simple script uses `DROP TABLE IF EXISTS` so it's safe to run
3. **RLS errors**: The simple script uses permissive policies that should work for testing
4. **Still getting permission denied**:
   - Make sure you're signed in to your app
   - Check that your Supabase environment variables are correct
   - Try the simple setup script which grants permissions to all roles

## Next Steps

Once this basic setup works, you can:

- Add more fields to the table
- Create additional tables for trade history
- Add more complex features

But for now, this simple single-table approach should work for basic bot creation and management.
