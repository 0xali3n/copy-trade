# WebSocket Trading Bot

This WebSocket-based trading bot automatically monitors your positions and places close orders when new positions are opened.

## Features

- **Real-time Position Monitoring**: Connects to Kana Labs WebSocket to monitor position updates
- **Automatic Close Orders**: Places close orders at +$100 profit when positions open
- **Robust Error Handling**: Handles disconnections, reconnections, and API errors
- **Profile Address Management**: Automatically fetches and uses your profile address
- **Graceful Shutdown**: Handles SIGINT/SIGTERM signals for clean shutdown

## How It Works

1. **Initialization**:

   - Gets your profile address from the Kana Labs API
   - Connects to the WebSocket server
   - Subscribes to position updates

2. **Position Monitoring**:

   - Listens for real-time position updates via WebSocket
   - Tracks new positions using trade IDs to avoid duplicates

3. **Automatic Trading**:

   - When a new position is detected, automatically calculates close price (+$100 for longs, -$100 for shorts)
   - Places a limit order to close the position at the calculated price
   - Logs all activities for monitoring

4. **Connection Management**:
   - Sends ping messages every 20 seconds to keep connection alive
   - Automatically reconnects on disconnection (up to 10 attempts)
   - Exponential backoff for reconnection delays

## Usage

### Prerequisites

Make sure you have the required environment variables in your `.env` file:

```env
KANA_API_KEY=your_api_key_here
APTOS_PRIVATE_KEY_HEX=your_private_key_here
APTOS_ADDRESS=your_wallet_address_here
```

### Running the Bot

#### Option 1: Direct WebSocket Bot

```bash
npm run websocket-bot
```

#### Option 2: Test WebSocket Bot (with instructions)

```bash
npm run test-websocket-bot
```

### How to Test

1. **Start the Bot**: Run one of the commands above
2. **Place a Buy Order**: Use your existing trading interface or the `single-limit` script to place a buy order
3. **Monitor Console**: The bot will detect the new position and automatically place a close order
4. **Stop the Bot**: Press `Ctrl+C` for graceful shutdown

## Example Output

```
2024-01-15 10:30:00 - Initializing WebSocket Trading Bot...
2024-01-15 10:30:01 - Getting profile address...
2024-01-15 10:30:02 - Profile address: 0x3c78886aa67752706b3502b12959edf92e68d85ae64b24226783d26ce6efc1e
2024-01-15 10:30:03 - Connecting to WebSocket...
2024-01-15 10:30:04 - WebSocket connected successfully!
2024-01-15 10:30:05 - Subscribed to position updates for address: 0x3c78886aa67752706b3502b12959edf92e68d85ae64b24226783d26ce6efc1e
2024-01-15 10:30:06 - 🚀 WebSocket Trading Bot started successfully!
2024-01-15 10:30:07 - Monitoring positions and will automatically place close orders at +$100 profit...

2024-01-15 10:35:12 - Received position update: {...}
2024-01-15 10:35:13 - New position detected:
  Trade ID: 16509835945970048696716
  Market ID: 15
  Side: Long
  Entry Price: $115600
  Size: 0.00012
  Leverage: 10x

2024-01-15 10:35:14 - Placing automatic close order:
  Entry Price: $115600
  Close Price: $115700 (+$100)
  Size: 0.00012
  Leverage: 10x

2024-01-15 10:35:16 - ✅ Automatic close order placed successfully!
  Transaction Hash: 0xabc123...
  Close Price: $115700
```

## Configuration

The bot uses the following configuration from your `config.ts`:

- **WebSocket URL**: `wss://perpetuals-indexer-ws.kana.trade/ws/` (mainnet)
- **REST API URL**: `https://perps-tradeapi.kana.trade`
- **Ping Interval**: 20 seconds
- **Max Reconnection Attempts**: 10
- **Reconnection Delay**: 5 seconds (with exponential backoff)

## Supported Markets

The bot works with all supported markets:

| Asset   | Market ID (Testnet) | Market ID (Mainnet) |
| ------- | ------------------- | ------------------- |
| APT-USD | 1338                | 14                  |
| BTC-USD | 1339                | 15                  |
| ETH-USD | 1340                | 16                  |
| SOL-USD | 2387                | 31                  |

## Error Handling

The bot includes comprehensive error handling:

- **WebSocket Disconnections**: Automatic reconnection with exponential backoff
- **API Errors**: Graceful handling of API failures with detailed error messages
- **Transaction Failures**: Proper error reporting for failed transactions
- **Network Issues**: Retry logic for network-related problems

## Security Notes

- The bot uses your private key to sign transactions
- All API calls include your API key for authentication
- WebSocket connections are secured with proper authentication
- Profile address is fetched securely from the API

## Troubleshooting

### Common Issues

1. **"Failed to get profile address"**

   - Check your API key and wallet address in `.env`
   - Ensure your wallet has been used with Kana Labs before

2. **"WebSocket connection failed"**

   - Check your internet connection
   - Verify the WebSocket URL in your config

3. **"Transaction failed to confirm"**
   - Check your Aptos private key
   - Ensure you have sufficient balance for gas fees

### Debug Mode

For more detailed logging, you can modify the console.log statements in the bot to include more information about the WebSocket messages and API responses.

## Integration with Existing Code

The WebSocket bot can be integrated with your existing trading scripts:

```typescript
import { WebSocketTradingBot } from "./websocketTradingBot";

// Start the bot
const bot = new WebSocketTradingBot();
await bot.start();

// Your existing trading logic here...

// Stop the bot when done
bot.stop();
```

This allows you to combine manual trading with automatic position management.
