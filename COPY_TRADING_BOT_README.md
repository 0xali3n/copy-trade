# Kana Labs Copy Trading Bot

An advanced copy trading bot that monitors and automatically copies trades from any Kana Labs user in real-time via WebSocket.

## Features

- 🎯 **Automatic Copy Trading**: Automatically executes the same trades as the target user
- 📊 **Real-time Monitoring**: WebSocket connection for instant trade notifications
- 📈 **Smart Trade Copying**: Copies buy, sell, and exit orders with configurable size multipliers
- 📍 **Position Tracking**: Displays current positions and position changes
- 🔄 **Auto Reconnect**: Automatically reconnects if connection is lost
- 🎨 **Beautiful Console Output**: Formatted display with emojis and clear sections
- ⚙️ **Configurable Settings**: Adjust copy size, multipliers, and limits

## Setup

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Configure Environment**:

   - Copy `env.example` to `.env`
   - Fill in your Kana Labs API key and Aptos wallet details
   - Set the `TARGET_WALLET_ADDRESS` to the wallet you want to copy trade from

3. **Run the Bot**:
   ```bash
   npm run copy-trade
   ```

## How It Works

1. **Start the Bot**: Run `npm run copy-trade`
2. **Automatic Monitoring**: The bot automatically monitors the target wallet from your `.env` file
3. **Copy Trades**: When the target user makes a trade, the bot automatically copies it on your account
4. **Real-time Updates**: All trades and positions are displayed in real-time

## Example Output

```
🎯 NEW ORDER DETECTED FROM TARGET USER
================================================================================
📅 Time: 1/15/2025, 2:30:45 PM
🆔 Order ID: 176590681017621537621306
📊 Market: BTC-USD (ID: 15)
📈 Order Type: Limit Buy
💰 Price: $115,300
📏 Size: 0.0001
⚡ Leverage: 10x
📊 Status: Open
📍 Address: 0x73e73911c0771e4d58f17aea3d0c70980ca2bae32c665b37101d1a18f4ef60f1
================================================================================
🟢 ACTION: BUY ORDER PLACED
   Target user placed BUY order: 0.0001 at $115300

🔄 COPYING ORDER:
   Original Size: 0.0001
   Copy Size: 0.0001 (1x multiplier)
   Market: BTC-USD
   Price: $115300
   Leverage: 10x
   Order Type: Limit Buy

✅ COPY ORDER SUCCESSFUL!
   Transaction Hash: 0x1234567890abcdef...
   Copied: 0.0001 BTC-USD at $115300
   Action: OPENED LONG position
================================================================================
```

## Supported Markets

- **APT-USD** (Market ID: 14 mainnet, 1338 testnet)
- **BTC-USD** (Market ID: 15 mainnet, 1339 testnet)
- **ETH-USD** (Market ID: 16 mainnet, 1340 testnet)
- **SOL-USD** (Market ID: 31 mainnet, 2387 testnet)

## Order Types

The bot recognizes and automatically copies all 12 order types:

**Open Position Orders:**

- Market Buy (1) - Opens LONG position at market price
- Limit Buy (2) - Opens LONG position at limit price
- Stop Buy (3) - Opens LONG position when price hits stop level
- Market Sell (4) - Opens SHORT position at market price
- Limit Sell (5) - Opens SHORT position at limit price
- Stop Sell (6) - Opens SHORT position when price hits stop level

**Exit Position Orders:**

- Market Exit Long (7) - Closes LONG position at market price
- Limit Exit Long (8) - Closes LONG position at limit price
- Stop Exit Long (9) - Closes LONG position when price hits stop level
- Market Exit Short (10) - Closes SHORT position at market price
- Limit Exit Short (11) - Closes SHORT position at limit price
- Stop Exit Short (12) - Closes SHORT position when price hits stop level

**Smart Copy Logic:**

- Buy orders (1-3) → Copy as LONG position opens
- Sell orders (4-6) → Copy as SHORT position opens
- Exit Long orders (7-9) → Copy as LONG position closes
- Exit Short orders (10-12) → Copy as SHORT position closes

## WebSocket Topics

The bot subscribes to:

- `order_history`: Real-time order updates (all order types including limit, stop, market orders)
- This captures orders as soon as they are placed, not just when they are filled

## Configuration

Edit your `.env` file with:

- `KANA_API_KEY`: Your Kana Labs API key
- `KANA_WS`: WebSocket URL (default: mainnet)
- `APTOS_PRIVATE_KEY_HEX`: Your Aptos private key
- `APTOS_ADDRESS`: Your Aptos wallet address
- `TARGET_WALLET_ADDRESS`: The wallet address you want to copy trade from

## Copy Trading Settings

The bot includes configurable settings in the code:

- `copyTradingEnabled`: Enable/disable automatic copying (default: true)
- `copySizeMultiplier`: Size multiplier for copied trades (default: 1.0x)
- `maxCopySize`: Maximum size to copy (default: 0.001 BTC)
- `minCopySize`: Minimum size to copy (default: 0.0001 BTC)

## Stopping the Bot

Press `Ctrl+C` to gracefully stop the bot.

## Important Notes

⚠️ **Risk Warning**: Copy trading involves financial risk. The bot will automatically execute trades on your account based on another user's actions. Make sure you understand the risks and have sufficient funds.

✅ **Features**:

- Automatically copies all trade types (buy, sell, exit orders)
- Maintains same leverage and market as target user
- Configurable size limits and multipliers
- Real-time monitoring and execution
- Automatic reconnection on connection loss

## Next Steps

Future enhancements could include:

- Risk management features (stop loss, position limits)
- Multiple user monitoring
- Trade filtering and analysis
- Performance tracking and statistics
- Advanced position sizing algorithms
