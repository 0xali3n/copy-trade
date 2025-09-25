# Wallet-Based Authentication Setup Guide

This guide will help you set up wallet-based authentication for your Kana Copy Trading application using Supabase for user storage and session management.

## 🏗️ Architecture Overview

- **Frontend**: React with wallet connection and authentication context
- **Backend**: Express.js with authentication middleware and user management
- **Database**: Supabase PostgreSQL for user storage and sessions
- **Authentication**: Wallet-based with session tokens

## 📋 Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Node.js**: Version 18 or higher
3. **npm/pnpm**: Package manager

## 🚀 Setup Instructions

### 1. Supabase Database Setup

1. **Create a new Supabase project**:

   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and API keys

2. **Run the database schema**:

   ```sql
   -- Copy and run the contents of backend/database/schema.sql in your Supabase SQL editor
   ```

3. **Get your Supabase credentials**:
   - Project URL: `https://your-project-id.supabase.co`
   - Anon Key: Found in Settings > API
   - Service Role Key: Found in Settings > API (keep this secret!)

### 2. Backend Setup

1. **Install dependencies**:

   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file in the `backend` directory:

   ```env
   # Existing Kana Labs Configuration
   KANA_API_KEY=your_kana_api_key
   KANA_REST=https://perps-tradeapi.kana.trade
   KANA_WS=wss://perpetuals-indexer-ws.kana.trade/ws/

   # Aptos Configuration
   APTOS_PRIVATE_KEY_HEX=your_aptos_private_key
   APTOS_ADDRESS=your_aptos_address
   APTOS_NODE=https://fullnode.mainnet.aptoslabs.com

   # Supabase Configuration
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Server Configuration
   PORT=3001
   FRONTEND_URL=http://localhost:5173

   # Market Configuration
   MARKET_ID=15
   TARGET_WALLET_ADDRESS=your_target_wallet_address
   ```

3. **Build and start the backend**:
   ```bash
   npm run build
   npm start
   # Or for development:
   npm run dev
   ```

### 3. Frontend Setup

1. **Install dependencies**:

   ```bash
   cd frontend
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file in the `frontend` directory:

   ```env
   # API Configuration
   VITE_API_URL=http://localhost:3001/api

   # Optional: Direct Supabase access (if needed)
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Start the frontend**:
   ```bash
   npm run dev
   ```

## 🔐 Authentication Flow

### 1. Wallet Connection

- User connects their Aptos wallet (Petra, Martian, etc.)
- Frontend detects wallet connection

### 2. Automatic Login

- When wallet connects, frontend automatically calls `/api/auth/login`
- Backend creates or retrieves user from Supabase
- Session token is generated and stored

### 3. Session Management

- Session tokens are stored in localStorage
- Tokens expire after 30 days
- Auto-refresh functionality for seamless experience

### 4. Protected Routes

- All API endpoints require authentication
- Frontend shows different UI based on auth state

## 📊 Database Schema

### Users Table

```sql
- id: UUID (Primary Key)
- wallet_address: TEXT (Unique)
- wallet_name: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- last_login: TIMESTAMP
- profile_data: JSONB
- trading_settings: JSONB
```

### User Sessions Table

```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- wallet_address: TEXT
- session_token: TEXT (Unique)
- expires_at: TIMESTAMP
- created_at: TIMESTAMP
- is_active: BOOLEAN
```

### User Activity Table

```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- activity_type: TEXT
- activity_data: JSONB
- created_at: TIMESTAMP
```

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/login` - Login with wallet address
- `POST /api/auth/logout` - Logout and invalidate session
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/settings` - Update trading settings
- `GET /api/auth/verify` - Verify session token

### Dashboard (Protected)

- `GET /api/dashboard/profile` - Get user profile
- `GET /api/dashboard/balance` - Get user balance
- `GET /api/dashboard/markets` - Get available markets
- `GET /api/dashboard/stats` - Get trading statistics

### Trading (Protected)

- `POST /api/trading/start` - Start copy trading
- `POST /api/trading/stop` - Stop copy trading
- `GET /api/trading/status` - Get trading status
- `PUT /api/trading/settings` - Update trading settings
- `GET /api/trading/activity` - Get trading activity

## 🎯 Key Features

### 1. Automatic User Creation

- Users are automatically created when they first connect their wallet
- No manual registration required

### 2. Persistent Sessions

- Users stay logged in across browser sessions
- Session tokens are securely stored and managed

### 3. User Profile Management

- Users can update their display name and preferences
- Trading settings are stored per user

### 4. Activity Tracking

- All user activities are logged for analytics
- Trading history and statistics

### 5. Security

- Session tokens are cryptographically secure
- Automatic session expiration
- CORS protection

## 🚨 Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **Service Role Key**: Keep the Supabase service role key secret
3. **CORS**: Configure CORS properly for production
4. **Session Expiration**: Sessions expire after 30 days
5. **Input Validation**: All inputs are validated on the backend

## 🐛 Troubleshooting

### Common Issues

1. **"Authentication required" error**:

   - Check if session token is present in localStorage
   - Verify Supabase credentials are correct

2. **"User not found" error**:

   - Ensure the user was created during login
   - Check Supabase database connection

3. **CORS errors**:

   - Verify FRONTEND_URL in backend .env
   - Check CORS configuration in server.ts

4. **Session not persisting**:
   - Check localStorage permissions
   - Verify session token format

### Debug Mode

Enable debug logging by adding to your .env:

```env
DEBUG=true
```

## 📈 Production Deployment

### Backend

1. Set up a production database (Supabase Pro)
2. Configure environment variables
3. Deploy to your preferred platform (Vercel, Railway, etc.)

### Frontend

1. Update API URL to production backend
2. Build and deploy to your preferred platform
3. Configure custom domain if needed

### Security Checklist

- [ ] Use HTTPS in production
- [ ] Set secure CORS origins
- [ ] Use environment variables for all secrets
- [ ] Enable Supabase Row Level Security (RLS)
- [ ] Set up proper error monitoring

## 🔄 Updates and Maintenance

### Database Migrations

When updating the schema, create migration files and run them in Supabase.

### Session Cleanup

Set up a cron job to clean expired sessions:

```sql
SELECT cleanup_expired_sessions();
```

### Monitoring

- Monitor user registration rates
- Track session duration
- Monitor API response times
- Set up alerts for authentication failures

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section
2. Review the console logs
3. Verify your Supabase configuration
4. Check network connectivity

---

**Note**: This authentication system is designed specifically for wallet-based authentication. Users are identified by their wallet address, and no traditional username/password is required.
