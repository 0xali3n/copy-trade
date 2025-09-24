# Kana Copy Trading Bot - Full Stack Application

A complete copy trading bot for Kana Labs Perpetual Futures with a modern React frontend and Node.js backend.

## 🏗️ Architecture

```
├── frontend/          # React + TypeScript + Vite frontend
├── backend/           # Node.js + Express backend
├── src/              # Original copy trading bot (preserved)
└── README.md
```

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp ../env.example .env
# Edit .env with your API keys and wallet address
npm run dev
```

Backend will run on `http://localhost:3001`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

### 3. Original Bot (Still Works!)

```bash
npm run copy-trade
```

## 📊 Features

### Frontend

- ✅ Beautiful landing page with modern UI
- ✅ Copy trading dashboard
- ✅ Real-time bot status monitoring
- ✅ Configuration management
- ✅ Trading activity display

### Backend

- ✅ REST API for frontend communication
- ✅ WebSocket service for real-time trading
- ✅ Copy trading bot service
- ✅ User settings management
- ✅ Trading statistics

### Copy Trading Bot

- ✅ Real-time order detection via WebSocket
- ✅ All 12 order types supported
- ✅ Automatic trade copying
- ✅ Risk management controls
- ✅ Position sizing controls

## 🔧 API Endpoints

### Trading

- `POST /api/trading/start` - Start copy trading
- `POST /api/trading/stop` - Stop copy trading
- `GET /api/trading/status` - Get bot status
- `PUT /api/trading/settings` - Update settings
- `GET /api/trading/activity` - Get trading activity

### Dashboard

- `GET /api/dashboard/profile` - Get user profile
- `GET /api/dashboard/balance` - Get user balance
- `GET /api/dashboard/markets` - Get available markets
- `GET /api/dashboard/stats` - Get trading statistics

### User

- `GET /api/user/settings` - Get user settings
- `PUT /api/user/settings` - Update user settings
- `GET /api/user/preferences` - Get user preferences
- `PUT /api/user/preferences` - Update user preferences

## 🎯 How It Works

1. **Frontend** - Beautiful UI for monitoring and control
2. **Backend API** - REST endpoints for frontend communication
3. **WebSocket Service** - Real-time order detection from target trader
4. **Copy Trading Logic** - Automatically replicates trades
5. **Kana Labs API** - Places orders on your behalf

## 🔐 Environment Variables

```env
# Kana Labs API
KANA_API_KEY=your_api_key_here
KANA_REST=https://perps-tradeapi.kana.trade
KANA_WS=wss://perpetuals-indexer-ws.kana.trade/ws/

# Aptos Wallet
APTOS_PRIVATE_KEY_HEX=your_private_key_here
APTOS_ADDRESS=your_wallet_address_here

# Copy Trading
TARGET_WALLET_ADDRESS=target_trader_address_here
```

## 📱 Usage

1. **Start Backend**: `cd backend && npm run dev`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Open Browser**: Go to `http://localhost:5173`
4. **Configure**: Set target wallet address and copy settings
5. **Start Bot**: Click "Start Bot" in the dashboard
6. **Monitor**: Watch real-time trading activity

## 🛡️ Safety Features

- Position size limits (min/max copy size)
- Copy size multiplier control
- Real-time order validation
- Error handling and logging
- WebSocket reconnection

## 🔄 Development

The original copy trading bot is preserved in the `src/` directory and still works independently:

```bash
npm run copy-trade
```

The new full-stack application adds:

- Web interface for easier control
- Real-time monitoring
- Better configuration management
- API for future integrations

## 📈 Next Steps

- [ ] Add Supabase database integration
- [ ] Implement user authentication
- [ ] Add more trading statistics
- [ ] Create mobile app
- [ ] Add multiple trader support
- [ ] Implement advanced risk management

## 🎉 Success!

You now have a complete copy trading application with:

- ✅ Working copy trading bot (preserved)
- ✅ Modern React frontend
- ✅ Node.js backend API
- ✅ Real-time WebSocket integration
- ✅ Beautiful UI/UX

The bot is ready to copy trades from any target wallet address!
