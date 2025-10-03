# 🚀 Social Trade - Advanced Copy Trading Platform

> **Real-time social trading platform built on Aptos blockchain with Kana Labs integration**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Aptos](https://img.shields.io/badge/Aptos-000000?style=for-the-badge&logo=aptos&logoColor=white)](https://aptoslabs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [🏗️ Architecture](#️-architecture)
- [⚡ Key Features](#-key-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [📊 Workflow](#-workflow)
- [🔧 Configuration](#-configuration)
- [📱 Screenshots](#-screenshots)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🎯 Overview

**Social Trade** is a cutting-edge social trading platform that enables users to automatically copy trades from successful traders in real-time. Built on the Aptos blockchain and integrated with Kana Labs perpetual futures, it provides a seamless experience for both traders and followers.

### 🌟 What Makes It Special

- **Real-time Copy Trading**: Automatically replicate trades from top performers
- **Multi-Bot Management**: Handle multiple trading bots simultaneously
- **Social Feed**: Share trades, insights, and market analysis
- **Advanced Analytics**: Comprehensive performance tracking and statistics
- **Gas-Optimized**: Efficient transaction handling with minimal fees
- **Dynamic Bot Management**: Add/remove bots without backend restarts

## 🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Blockchain    │
│   (React/TS)    │◄──►│   (Node.js/TS)  │◄──►│   (Aptos)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Supabase      │    │  Kana Labs      │    │   WebSocket     │
│   (Database)    │    │  (Trading API)  │    │   (Real-time)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Architecture

```
Frontend (React + TypeScript)
├── 📱 Pages
│   ├── Dashboard (Bot Management)
│   ├── Trading Feed (Social Platform)
│   ├── Trades History
│   └── Settings
├── 🧩 Components
│   ├── TradingFeed (Social Posts)
│   ├── Bot Management
│   ├── Balance Display
│   └── Google Auth
└── 🔧 Services
    ├── Bot Management
    ├── Trade History
    ├── Backend Communication
    └── Wallet Integration

Backend (Node.js + TypeScript)
├── 🎯 Core Services
│   ├── Copy Trading Service
│   ├── Order History Service
│   ├── WebSocket Service
│   └── Supabase Service
├── 🔗 Integrations
│   ├── Kana Labs API
│   ├── Aptos Blockchain
│   └── Supabase Database
└── 🚀 Server
    ├── Express.js API
    ├── Health Checks
    └── Dynamic Bot Refresh
```

## ⚡ Key Features

### 🤖 Advanced Copy Trading

- **Real-time Order Detection**: WebSocket-based order monitoring
- **Multi-Bot Support**: Manage unlimited trading bots
- **Exact Copy Trading**: Replicate trades with identical parameters
- **Gas Optimization**: Minimal transaction fees (~0.001 APT per trade)
- **Dynamic Bot Management**: Add/remove bots without system restart

### 📱 Social Trading Platform

- **Trading Feed**: Share and discover trading strategies
- **User Profiles**: Comprehensive trader profiles with performance metrics
- **Interactive Posts**: Like, comment, and follow successful traders
- **Real-time Updates**: Live market data and trade notifications

### 🔧 Technical Excellence

- **TypeScript**: Full type safety across frontend and backend
- **Real-time Communication**: WebSocket integration for live updates
- **Database Optimization**: Efficient queries with proper indexing
- **Error Handling**: Comprehensive error management and logging
- **Environment Configuration**: Flexible deployment configuration

## 🛠️ Tech Stack

### Frontend

- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast build tool
- **Supabase Client** - Database integration
- **Google OAuth** - Authentication

### Backend

- **Node.js** - Runtime environment
- **TypeScript** - Type-safe development
- **Express.js** - Web framework
- **WebSocket** - Real-time communication
- **Aptos SDK** - Blockchain integration
- **Axios** - HTTP client

### Blockchain & APIs

- **Aptos Blockchain** - Layer 1 blockchain
- **Kana Labs API** - Perpetual futures trading
- **Kana Labs WebSocket** - Real-time order data
- **Supabase** - PostgreSQL database
- **Google OAuth** - User authentication

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Git** - Version control
- **pnpm** - Package management

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase account
- Kana Labs API key
- Aptos wallet

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/social-trade.git
cd social-trade
```

2. **Install dependencies**

```bash
# Backend
cd backend
pnpm install

# Frontend
cd ../frontend
pnpm install
```

3. **Environment Setup**

**Backend (.env)**

```env
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Kana Labs API
KANA_API_KEY=your_kana_api_key
KANA_REST=https://perps-tradeapi.kana.trade
KANA_WS=wss://perpetuals-indexer-ws.kana.trade/ws/

# Aptos Configuration
APTOS_NODE=https://fullnode.mainnet.aptoslabs.com
APTOS_NETWORK=mainnet
MARKET_ID=15

# Gas Wallet (Optional)
GAS_WALLET_PRIVATE_KEY=your_gas_wallet_private_key
```

**Frontend (.env)**

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend Configuration
VITE_BACKEND_HOST=localhost
VITE_BACKEND_PORT=3001

# Kana Labs API
VITE_KANA_API_KEY=your_kana_api_key
VITE_KANA_BASE_URL=https://perps-tradeapi.kana.trade

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

4. **Database Setup**

```sql
-- Run the SQL scripts in frontend/database/
-- 1. enhanced_bots_table_with_private_key.sql
-- 2. copy_trading_trades_table.sql
```

5. **Start the application**

```bash
# Terminal 1 - Backend
cd backend
pnpm run dev

# Terminal 2 - Frontend
cd frontend
pnpm run dev
```

6. **Access the application**

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## 📊 Workflow

### Copy Trading Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant K as Kana Labs
    participant A as Aptos
    participant S as Supabase

    U->>F: Create Copy Bot
    F->>S: Store Bot Config
    F->>B: Signal Bot Refresh
    B->>S: Fetch Active Bots
    B->>K: Subscribe to Order History

    Note over K: Target Trader Places Order
    K->>B: WebSocket Order Data
    B->>B: Process Order
    B->>K: Place Copy Order
    K->>A: Submit Transaction
    A->>B: Transaction Confirmation
    B->>S: Store Trade Record
    B->>F: Update Status
    F->>U: Show Trade Result
```

### System Workflow

```mermaid
graph TD
    A[User Login] --> B[Create/Manage Bots]
    B --> C[Backend Monitors Orders]
    C --> D[Order Detected]
    D --> E[Process Order]
    E --> F[Place Copy Trade]
    F --> G[Store in Database]
    G --> H[Update Frontend]
    H --> I[User Sees Results]

    J[Social Feed] --> K[Share Trades]
    K --> L[Other Users See]
    L --> M[Start Copying]
    M --> B
```

## 🔧 Configuration

### Environment Variables

| Variable                 | Description          | Required |
| ------------------------ | -------------------- | -------- |
| `PORT`                   | Backend server port  | Yes      |
| `SUPABASE_URL`           | Supabase project URL | Yes      |
| `KANA_API_KEY`           | Kana Labs API key    | Yes      |
| `APTOS_NODE`             | Aptos RPC endpoint   | Yes      |
| `GAS_WALLET_PRIVATE_KEY` | Gas funding wallet   | Optional |

### Database Schema

**copy_trading_bots**

```sql
- id (UUID, Primary Key)
- user_address (Text)
- user_private_key (Text)
- target_address (Text)
- bot_name (Text)
- status (Text: active/paused/stopped)
- created_at (Timestamp)
- updated_at (Timestamp)
```

**copy_trading_trades**

```sql
- id (UUID, Primary Key)
- user_wallet_address (Text)
- bot_id (UUID, Foreign Key)
- symbol (Text)
- market_id (Text)
- action (Text: BUY/SELL/EXIT_LONG/EXIT_SHORT)
- order_type (Text: MARKET/LIMIT/STOP)
- leverage (Integer)
- price (Decimal)
- quantity (Decimal)
- transaction_hash (Text)
- status (Text: SUCCESS/FAILED/PENDING)
- created_at (Timestamp)
```

## 📱 Screenshots

### Screenshot Placeholders

Please add the following screenshots to showcase the platform:

1. **Dashboard Overview** (`screenshots/dashboard.png`)

   - Show the main dashboard with bot management
   - Display active bots, performance metrics
   - Include the "Create Bot" and "Test Signal" buttons

2. **Trading Feed** (`screenshots/trading-feed.png`)

   - Show the social trading feed with posts
   - Display trade posts with "Start Copy Bot" buttons
   - Include user avatars and trade details

3. **Bot Creation Popup** (`screenshots/bot-creation.png`)

   - Show the bot creation popup from trading feed
   - Display custom bot name input and target wallet
   - Include the "Start Bot" button

4. **Trades History** (`screenshots/trades-history.png`)

   - Show the trades page with filtering options
   - Display successful trades with transaction hashes
   - Include status indicators and timestamps

5. **Settings Page** (`screenshots/settings.png`)

   - Show user settings with wallet information
   - Display Google OAuth integration
   - Include profile management options

6. **Mobile Responsive** (`screenshots/mobile-view.png`)
   - Show the platform on mobile devices
   - Display responsive design and touch interactions

## 🚀 Deployment

### Production Deployment

1. **Backend Deployment**

```bash
# Build the backend
cd backend
pnpm run build

# Deploy to your preferred platform
# (Vercel, Railway, Heroku, etc.)
```

2. **Frontend Deployment**

```bash
# Build the frontend
cd frontend
pnpm run build

# Deploy to Vercel, Netlify, or similar
```

3. **Environment Configuration**

- Update production environment variables
- Configure CORS settings
- Set up SSL certificates
- Configure domain names

## 🔒 Security Features

- **Private Key Management**: Secure storage and handling of user private keys
- **API Key Protection**: Environment-based configuration
- **CORS Configuration**: Proper cross-origin resource sharing
- **Input Validation**: Comprehensive data validation
- **Error Handling**: Secure error messages without sensitive data exposure

## 📈 Performance Optimizations

- **WebSocket Connection**: Real-time data with minimal latency
- **Database Indexing**: Optimized queries for fast data retrieval
- **Gas Optimization**: Minimal transaction fees (~0.001 APT)
- **Caching**: Efficient data caching strategies
- **Bundle Optimization**: Optimized frontend builds

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow the existing code style
- Ensure all builds pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Aptos Labs** - For the innovative blockchain platform
- **Kana Labs** - For the comprehensive trading API
- **Supabase** - For the powerful database platform
- **React Team** - For the amazing frontend framework
- **Node.js Community** - For the robust backend runtime

## 📞 Support

For support, email support@socialtrade.com or join our Discord community.

---

**Built with ❤️ by the Social Trade Team**

_Empowering traders through social collaboration and automated copy trading._
