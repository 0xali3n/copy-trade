# 🏗️ Social Trade - System Architecture

## Overview

Social Trade is a sophisticated social trading platform that combines real-time copy trading with social networking features. The system is built on a modern microservices architecture with clear separation of concerns.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Social Trade Platform                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   Frontend      │    │    Backend      │    │  Blockchain  │ │
│  │   (React/TS)    │◄──►│   (Node.js/TS)  │◄──►│   (Aptos)    │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│         │                       │                       │       │
│         │                       │                       │       │
│         ▼                       ▼                       ▼       │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   Supabase      │    │  Kana Labs      │    │   WebSocket  │ │
│  │   (Database)    │    │  (Trading API)  │    │  (Real-time) │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Architecture

```
Frontend (React + TypeScript)
├── 📱 Pages
│   ├── DashboardPage.tsx          # Bot management interface
│   ├── TradingFeed.tsx            # Social trading feed
│   ├── TradesPage.tsx             # Trade history and analytics
│   ├── SettingsPage.tsx           # User settings and profile
│   └── HomePage.tsx               # Landing page
├── 🧩 Components
│   ├── TradingFeed/               # Social feed components
│   │   ├── Post creation
│   │   ├── Trade display
│   │   └── Bot creation popup
│   ├── Bot Management/            # Bot control components
│   │   ├── Bot creation form
│   │   ├── Bot status display
│   │   └── Performance metrics
│   ├── BalanceHeader.tsx          # Wallet balance display
│   ├── DepositPopup.tsx           # Funding interface
│   └── GoogleAuthButton.tsx       # Authentication
├── 🔧 Services
│   ├── simpleBotService.ts        # Bot CRUD operations
│   ├── tradesService.ts           # Trade data management
│   ├── backendSignalService.ts    # Backend communication
│   ├── walletService.ts           # Wallet operations
│   └── postsService.ts            # Social feed data
└── 🎨 Styling
    ├── Tailwind CSS               # Utility-first styling
    ├── Responsive design          # Mobile-first approach
    └── Dark/Light theme support   # User preference
```

### Backend Architecture

```
Backend (Node.js + TypeScript)
├── 🎯 Core Services
│   ├── copyTradingService.ts      # Core copy trading logic
│   │   ├── Order processing
│   │   ├── Trade execution
│   │   ├── Bot state management
│   │   └── Database operations
│   ├── orderHistoryService.ts     # WebSocket order monitoring
│   │   ├── Kana Labs WebSocket
│   │   ├── Order filtering
│   │   ├── Bot dispatch
│   │   └── Connection management
│   ├── websocketService.ts        # WebSocket utilities
│   └── supabaseService.ts         # Database operations
├── 🔗 Integrations
│   ├── Kana Labs API              # Trading operations
│   │   ├── Order placement
│   │   ├── Market data
│   │   └── Account management
│   ├── Aptos Blockchain           # Transaction handling
│   │   ├── Transaction building
│   │   ├── Signing and submission
│   │   └── Confirmation tracking
│   └── Supabase Database          # Data persistence
│       ├── Bot configurations
│       ├── Trade records
│       └── User data
├── 🚀 Server
│   ├── server.ts                  # Express.js server
│   ├── API endpoints              # RESTful API
│   ├── Health checks              # System monitoring
│   └── CORS configuration         # Security
└── ⚙️ Configuration
    ├── config.ts                  # Environment management
    ├── Type definitions           # TypeScript interfaces
    └── Error handling             # Comprehensive logging
```

## Data Flow Architecture

### Copy Trading Flow

```
1. User Action
   ↓
2. Frontend → Supabase (Store Bot Config)
   ↓
3. Frontend → Backend (Signal Refresh)
   ↓
4. Backend → Supabase (Fetch Active Bots)
   ↓
5. Backend → Kana Labs (Subscribe to Orders)
   ↓
6. Target Trader Places Order
   ↓
7. Kana Labs → Backend (WebSocket Order Data)
   ↓
8. Backend Processes Order
   ↓
9. Backend → Kana Labs (Place Copy Order)
   ↓
10. Kana Labs → Aptos (Submit Transaction)
    ↓
11. Aptos → Backend (Transaction Confirmation)
    ↓
12. Backend → Supabase (Store Trade Record)
    ↓
13. Backend → Frontend (Update Status)
    ↓
14. Frontend → User (Show Results)
```

### Social Feed Flow

```
1. User Creates Post
   ↓
2. Frontend → Supabase (Store Post)
   ↓
3. Supabase → Frontend (Real-time Update)
   ↓
4. Other Users See Post
   ↓
5. User Clicks "Start Copy Bot"
   ↓
6. Frontend Shows Bot Creation Popup
   ↓
7. User Configures Bot
   ↓
8. Frontend → Supabase (Create Bot)
   ↓
9. Frontend → Backend (Signal Refresh)
   ↓
10. Copy Trading Flow Begins
```

## Database Schema

### Core Tables

```sql
-- Copy Trading Bots
copy_trading_bots (
    id UUID PRIMARY KEY,
    user_address TEXT NOT NULL,
    user_private_key TEXT NOT NULL,
    target_address TEXT NOT NULL,
    bot_name TEXT,
    status TEXT CHECK (status IN ('active', 'paused', 'stopped')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Copy Trading Trades
copy_trading_trades (
    id UUID PRIMARY KEY,
    user_wallet_address TEXT NOT NULL,
    bot_id UUID REFERENCES copy_trading_bots(id),
    symbol TEXT NOT NULL,
    market_id TEXT NOT NULL,
    action TEXT CHECK (action IN ('BUY', 'SELL', 'EXIT_LONG', 'EXIT_SHORT')),
    order_type TEXT CHECK (order_type IN ('MARKET', 'LIMIT', 'STOP')),
    leverage INTEGER NOT NULL,
    price DECIMAL NOT NULL,
    quantity DECIMAL NOT NULL,
    transaction_hash TEXT,
    order_id TEXT,
    target_address TEXT,
    status TEXT CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    pnl DECIMAL,
    fees DECIMAL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users (Supabase Auth)
users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    google_id TEXT,
    aptos_wallet_address TEXT,
    aptos_public_key TEXT,
    aptos_private_key TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);
```

### Indexes for Performance

```sql
-- Optimized indexes for fast queries
CREATE INDEX idx_copy_trading_bots_user_address ON copy_trading_bots(user_address);
CREATE INDEX idx_copy_trading_bots_target_address ON copy_trading_bots(target_address);
CREATE INDEX idx_copy_trading_bots_status ON copy_trading_bots(status);
CREATE INDEX idx_copy_trading_trades_user_wallet ON copy_trading_trades(user_wallet_address);
CREATE INDEX idx_copy_trading_trades_bot_id ON copy_trading_trades(bot_id);
CREATE INDEX idx_copy_trading_trades_created_at ON copy_trading_trades(created_at DESC);
CREATE INDEX idx_copy_trading_trades_status ON copy_trading_trades(status);
```

## API Architecture

### RESTful Endpoints

```
Backend API (Express.js)
├── Health & Status
│   ├── GET /health                 # System health check
│   └── GET /status                 # Service status
├── Bot Management
│   └── POST /api/refresh-bots      # Dynamic bot refresh
└── WebSocket
    └── WebSocket /ws               # Real-time communication
```

### WebSocket Architecture

```
WebSocket Connections
├── Kana Labs WebSocket
│   ├── Connection: wss://perpetuals-indexer-ws.kana.trade/ws/
│   ├── Subscription: order_history
│   ├── Data: Real-time order updates
│   └── Reconnection: Automatic with exponential backoff
└── Frontend-Backend Communication
    ├── Bot refresh signals
    ├── Status updates
    └── Error notifications
```

## Security Architecture

### Authentication & Authorization

```
Security Layers
├── Google OAuth 2.0
│   ├── User authentication
│   ├── Profile management
│   └── Session management
├── Supabase Auth
│   ├── JWT tokens
│   ├── Row-level security
│   └── API key management
├── Private Key Management
│   ├── Encrypted storage
│   ├── Secure transmission
│   └── Access control
└── API Security
    ├── CORS configuration
    ├── Rate limiting
    └── Input validation
```

### Data Protection

```
Data Security
├── Encryption
│   ├── Private keys (AES-256)
│   ├── Database connections (SSL)
│   └── API communications (HTTPS)
├── Access Control
│   ├── User-based permissions
│   ├── Bot ownership validation
│   └── Transaction authorization
└── Audit Logging
    ├── All transactions logged
    ├── User actions tracked
    └── Error monitoring
```

## Performance Architecture

### Optimization Strategies

```
Performance Optimizations
├── Database
│   ├── Proper indexing
│   ├── Query optimization
│   ├── Connection pooling
│   └── Caching strategies
├── Frontend
│   ├── Code splitting
│   ├── Lazy loading
│   ├── Bundle optimization
│   └── CDN integration
├── Backend
│   ├── Async processing
│   ├── Memory management
│   ├── Connection reuse
│   └── Error handling
└── Blockchain
    ├── Gas optimization
    ├── Transaction batching
    ├── Fee estimation
    └── Confirmation tracking
```

### Scalability Considerations

```
Scalability Architecture
├── Horizontal Scaling
│   ├── Multiple backend instances
│   ├── Load balancing
│   ├── Database sharding
│   └── CDN distribution
├── Vertical Scaling
│   ├── Resource optimization
│   ├── Memory management
│   ├── CPU utilization
│   └── Storage optimization
└── Microservices
    ├── Service separation
    ├── Independent deployment
    ├── Fault isolation
    └── Technology diversity
```

## Monitoring & Observability

### Logging Architecture

```
Logging System
├── Application Logs
│   ├── Trade execution logs
│   ├── Error tracking
│   ├── Performance metrics
│   └── User activity
├── System Logs
│   ├── Server health
│   ├── Database performance
│   ├── API response times
│   └── WebSocket connections
└── Business Logs
    ├── Trading activity
    ├── User engagement
    ├── Bot performance
    └── Revenue tracking
```

### Monitoring Stack

```
Monitoring & Alerting
├── Health Checks
│   ├── Service availability
│   ├── Database connectivity
│   ├── API responsiveness
│   └── WebSocket status
├── Performance Metrics
│   ├── Response times
│   ├── Throughput rates
│   ├── Error rates
│   └── Resource utilization
└── Business Metrics
    ├── Active users
    ├── Trading volume
    ├── Bot performance
    └── Revenue metrics
```

## Deployment Architecture

### Environment Configuration

```
Deployment Environments
├── Development
│   ├── Local development
│   ├── Hot reloading
│   ├── Debug logging
│   └── Test data
├── Staging
│   ├── Production-like setup
│   ├── Integration testing
│   ├── Performance testing
│   └── User acceptance testing
└── Production
    ├── High availability
    ├── Load balancing
    ├── Monitoring
    └── Backup strategies
```

### CI/CD Pipeline

```
Deployment Pipeline
├── Code Repository
│   ├── Git version control
│   ├── Branch protection
│   ├── Code reviews
│   └── Automated testing
├── Build Process
│   ├── TypeScript compilation
│   ├── Dependency management
│   ├── Asset optimization
│   └── Security scanning
├── Testing
│   ├── Unit tests
│   ├── Integration tests
│   ├── End-to-end tests
│   └── Performance tests
└── Deployment
    ├── Automated deployment
    ├── Health checks
    ├── Rollback capability
    └── Monitoring setup
```

## Future Architecture Considerations

### Planned Enhancements

```
Future Architecture
├── Microservices Migration
│   ├── Service decomposition
│   ├── API gateway
│   ├── Service mesh
│   └── Event-driven architecture
├── Advanced Analytics
│   ├── Machine learning integration
│   ├── Real-time analytics
│   ├── Predictive modeling
│   └── Performance optimization
├── Multi-Chain Support
│   ├── Cross-chain compatibility
│   ├── Bridge integration
│   ├── Multi-wallet support
│   └── Unified interface
└── Mobile Applications
    ├── Native iOS app
    ├── Native Android app
    ├── Offline capabilities
    └── Push notifications
```

This architecture provides a solid foundation for the Social Trade platform, ensuring scalability, maintainability, and performance while supporting the complex requirements of real-time copy trading and social networking features.
