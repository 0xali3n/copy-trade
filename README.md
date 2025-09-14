# Kana Labs Perps Testnet Integration

A TypeScript project for testing Kana Labs Perps REST + WebSocket APIs on Aptos Testnet.

## Prerequisites

- Node.js 18+
- npm or yarn
- Kana Labs API key (email hello@kanalabs.io for Perps Testnet access)
- Aptos Testnet account with funded tokens

## Setup

1. **Clone and install dependencies:**

   ```bash
   npm install
   ```

2. **Get a Kana API key:**

   - Email hello@kanalabs.io requesting a Perps Testnet API key
   - They will provide you with an API key for testing

3. **Set up environment variables:**

   ```bash
   cp env.example .env
   ```

   Edit `.env` and fill in your values:

   - `KANA_API_KEY`: Your Kana Labs API key
   - `APTOS_PRIVATE_KEY_HEX`: Your existing Aptos private key (hex format)
   - `APTOS_ADDRESS`: Your existing Aptos address
   - `MARKET_ID`: Market to test (default: BTC-USD-PERP)

   **Note**: Use your existing wallet's private key and address. No need to generate new accounts.

4. **Fund your Aptos Testnet account:**

   **Option A: Using Aptos CLI**

   ```bash
   aptos account fund-with-faucet --account YOUR_ADDRESS
   ```

   **Option B: Using Web Faucet**

   - Visit: https://faucet.testnet.aptoslabs.com/
   - Enter your address and request tokens

## Phase 0: Basic Setup

### Available Commands

- `npm run get-profile` - Get user profile from Kana
- `npm run get-market` - Get market information
- `npm run ws` - Connect to WebSocket and listen for updates

## Phase 1: REST API Testing

### Get User Profile

```bash
npm run get-profile
```

Expected output:

```
[getProfile] 2024-01-XX XX:XX:XX - Fetching profile for address: 0x...
[getProfile] 2024-01-XX XX:XX:XX - Raw response: {...}
[getProfile] 2024-01-XX XX:XX:XX - Profile address: 0x...
```

### Get Market Information

```bash
npm run get-market
```

Expected output:

```
[getMarketInfo] 2024-01-XX XX:XX:XX - Fetching market info for: BTC-USD-PERP
[getMarketInfo] 2024-01-XX XX:XX:XX - Raw response: {...}
[getMarketInfo] 2024-01-XX XX:XX:XX - Market details:
  - Tick size: 0.01
  - Lot size: 0.001
  - Base decimals: 8
  - Leverage: 10x
```

### WebSocket Listener

```bash
npm run ws
```

Expected output:

```
[wsListener] 2024-01-XX XX:XX:XX - Connecting to WebSocket...
[wsListener] 2024-01-XX XX:XX:XX - Connected successfully
[wsListener] 2024-01-XX XX:XX:XX - Subscribing to orderbook:BTC-USD-PERP
[wsListener] 2024-01-XX XX:XX:XX - Subscribing to recent_trades:BTC-USD-PERP
[wsListener] 2024-01-XX XX:XX:XX - Message 1: {...}
[wsListener] 2024-01-XX XX:XX:XX - Message 2: {...}
...
```

## Manual API Testing

For manual testing of the `/createOrder` endpoint, you can use curl:

```bash
curl -X POST https://perps-tradeapi.kanalabs.io/createOrder \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "userAddress": "0x...",
    "marketId": "BTC-USD-PERP",
    "side": "buy",
    "size": "0.001",
    "price": "50000",
    "orderType": "limit"
  }'
```

## Troubleshooting

### Common Issues

1. **401/403 Unauthorized**

   - Check your `KANA_API_KEY` in `.env`
   - Verify the API key is valid and has Perps Testnet access

2. **Insufficient Funds**

   - Fund your Aptos Testnet account using the faucet
   - Check your account balance

3. **Market Not Found**

   - Verify the `MARKET_ID` exists
   - Try with default `BTC-USD-PERP`

4. **WebSocket Connection Issues**
   - Check your internet connection
   - Verify the WebSocket URL is correct
   - The script will attempt to reconnect automatically

## Project Structure

```
├── src/
│   ├── config.ts          # Environment configuration
│   ├── kanaClient.ts      # Kana API client wrapper
│   ├── getProfile.ts      # Get user profile
│   ├── getMarketInfo.ts   # Get market information
│   └── wsListener.ts      # WebSocket client
├── package.json
├── tsconfig.json
├── .gitignore
├── env.example
└── README.md
```

## Next Steps

After completing Phase 1, Phase 2 will implement:

- `placeOrder.ts` - Place orders via REST API
- Transaction signing and submission
- Order confirmation and status tracking
