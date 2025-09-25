# Kana Labs Backend

Clean, focused backend for Kana Labs API integration and Copy Trading Bot.

## 🚀 Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment:**

   ```bash
   cp env.example .env
   # Edit .env with your Kana Labs API key and Aptos private key
   ```

3. **Start the server:**

   ```bash
   npm run dev
   ```

4. **Backend will be running on:** `http://localhost:3001`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config.ts           # Environment configuration
│   ├── kanaClient.ts       # Kana Labs API client
│   ├── copyTradingBot.ts   # Copy trading bot implementation
│   ├── depositAndBalance.ts # Deposit and balance testing
│   └── server.ts           # Express server for API endpoints
├── package.json
└── README.md
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build TypeScript to JavaScript
- `npm run copy-trade` - Run copy trading bot directly
- `npm run deposit-test` - Test deposit functionality

## 🌐 API Endpoints

- `GET /health` - Health check
- `POST /api/copy-trade/start` - Start copy trading bot
- `POST /api/copy-trade/stop` - Stop copy trading bot
- `GET /api/copy-trade/status` - Get bot status and activity
- `POST /api/test/deposit` - Test deposit functionality

## 🔑 Environment Variables

Required in `.env` file:

```env
# Kana Labs API Configuration
KANA_API_KEY=your_kana_api_key_here
KANA_REST=https://perps-tradeapi.kana.trade
KANA_WS=wss://perpetuals-indexer-ws.kana.trade/ws/

# Aptos Configuration
APTOS_PRIVATE_KEY_HEX=your_aptos_private_key_here
APTOS_ADDRESS=your_aptos_address_here
APTOS_NODE=https://fullnode.mainnet.aptoslabs.com

# Copy Trading Configuration
TARGET_WALLET_ADDRESS=target_wallet_to_copy_from
MARKET_ID=BTC-USD-PERP
```

## 🎯 Features

- ✅ **Kana Labs API Integration** - Full API client with authentication
- ✅ **Copy Trading Bot** - Real-time WebSocket order monitoring and copying
- ✅ **Deposit Testing** - Test deposit and balance functionality
- ✅ **Express API** - RESTful endpoints for frontend integration
- ✅ **TypeScript** - Full type safety and modern development

## 🔗 Frontend Integration

The backend provides a simple API that the frontend can connect to:

1. **Health Check:** Verify backend is running
2. **Bot Control:** Start/stop copy trading bot
3. **Status Monitoring:** Get real-time bot status and activity
4. **Testing:** Run deposit and balance tests

## 🚨 Important Notes

- Make sure you have a valid Kana Labs API key
- Ensure your Aptos wallet has sufficient balance for trading
- The copy trading bot requires a target wallet address to monitor
- All transactions are on Aptos Mainnet
