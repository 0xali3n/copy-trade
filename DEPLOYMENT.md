# 🚀 Social Trade - Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Social Trade platform to production environments. The platform consists of a React frontend and Node.js backend, with integrations to Aptos blockchain, Kana Labs API, and Supabase database.

## Prerequisites

### Required Accounts & Services

1. **Supabase Account**

   - Create a new project
   - Get your project URL and API keys
   - Set up the database schema

2. **Kana Labs API**

   - Register for API access
   - Obtain your API key
   - Test API connectivity

3. **Aptos Wallet**

   - Create an Aptos wallet
   - Fund with APT for gas fees
   - Get wallet private key

4. **Google OAuth**

   - Create Google Cloud project
   - Enable Google+ API
   - Configure OAuth credentials

5. **Deployment Platform**
   - Choose hosting provider (Vercel, Railway, Heroku, etc.)
   - Set up domain and SSL
   - Configure environment variables

## Environment Setup

### Backend Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Kana Labs API Configuration
KANA_API_KEY=your_kana_api_key
KANA_REST=https://perps-tradeapi.kana.trade
KANA_WS=wss://perpetuals-indexer-ws.kana.trade/ws/

# Aptos Configuration
APTOS_NODE=https://fullnode.mainnet.aptoslabs.com
APTOS_NETWORK=mainnet
MARKET_ID=15

# Gas Wallet Configuration (Optional)
GAS_WALLET_PRIVATE_KEY=your_gas_wallet_private_key

# Backend API Configuration
BACKEND_HOST=your-backend-domain.com
BACKEND_PORT=3001
```

### Frontend Environment Variables

Create a `.env` file in the frontend directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend Configuration
VITE_BACKEND_HOST=your-backend-domain.com
VITE_BACKEND_PORT=3001

# Kana Labs API
VITE_KANA_API_KEY=your_kana_api_key
VITE_KANA_BASE_URL=https://perps-tradeapi.kana.trade

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# App Configuration
VITE_APP_NAME=Social Trade
VITE_APP_VERSION=1.0.0
```

## Database Setup

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Wait for the project to be ready
4. Note down your project URL and API keys

### 2. Run Database Migrations

Execute the following SQL scripts in your Supabase SQL editor:

```sql
-- 1. Create copy_trading_bots table
CREATE TABLE copy_trading_bots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_address TEXT NOT NULL,
    user_private_key TEXT NOT NULL,
    target_address TEXT NOT NULL,
    bot_name TEXT,
    status TEXT CHECK (status IN ('active', 'paused', 'stopped')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create copy_trading_trades table
CREATE TABLE copy_trading_trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_wallet_address TEXT NOT NULL,
    bot_id UUID REFERENCES copy_trading_bots(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    market_id TEXT NOT NULL,
    action TEXT CHECK (action IN ('BUY', 'SELL', 'EXIT_LONG', 'EXIT_SHORT')) NOT NULL,
    order_type TEXT CHECK (order_type IN ('MARKET', 'LIMIT', 'STOP')) NOT NULL,
    leverage INTEGER NOT NULL,
    price DECIMAL NOT NULL,
    quantity DECIMAL NOT NULL,
    transaction_hash TEXT,
    order_id TEXT,
    target_address TEXT,
    status TEXT CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')) DEFAULT 'PENDING',
    pnl DECIMAL,
    fees DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX idx_copy_trading_bots_user_address ON copy_trading_bots(user_address);
CREATE INDEX idx_copy_trading_bots_target_address ON copy_trading_bots(target_address);
CREATE INDEX idx_copy_trading_bots_status ON copy_trading_bots(status);
CREATE INDEX idx_copy_trading_trades_user_wallet ON copy_trading_trades(user_wallet_address);
CREATE INDEX idx_copy_trading_trades_bot_id ON copy_trading_trades(bot_id);
CREATE INDEX idx_copy_trading_trades_created_at ON copy_trading_trades(created_at DESC);
CREATE INDEX idx_copy_trading_trades_status ON copy_trading_trades(status);

-- 4. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Create triggers
CREATE TRIGGER update_copy_trading_bots_updated_at
    BEFORE UPDATE ON copy_trading_bots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_copy_trading_trades_updated_at
    BEFORE UPDATE ON copy_trading_trades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3. Configure Row Level Security (RLS)

```sql
-- Enable RLS on tables
ALTER TABLE copy_trading_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE copy_trading_trades ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth setup)
CREATE POLICY "Users can view their own bots" ON copy_trading_bots
    FOR SELECT USING (auth.uid()::text = user_address);

CREATE POLICY "Users can insert their own bots" ON copy_trading_bots
    FOR INSERT WITH CHECK (auth.uid()::text = user_address);

CREATE POLICY "Users can update their own bots" ON copy_trading_bots
    FOR UPDATE USING (auth.uid()::text = user_address);

CREATE POLICY "Users can view their own trades" ON copy_trading_trades
    FOR SELECT USING (auth.uid()::text = user_wallet_address);
```

## Deployment Options

### Option 1: Vercel (Recommended for Frontend)

#### Frontend Deployment

1. **Install Vercel CLI**

```bash
npm i -g vercel
```

2. **Deploy Frontend**

```bash
cd frontend
vercel --prod
```

3. **Configure Environment Variables**
   - Go to Vercel dashboard
   - Navigate to your project settings
   - Add all frontend environment variables

#### Backend Deployment

1. **Create vercel.json**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/server.js"
    }
  ]
}
```

2. **Deploy Backend**

```bash
cd backend
vercel --prod
```

### Option 2: Railway

#### Deploy Both Services

1. **Connect GitHub Repository**

   - Go to [Railway](https://railway.app)
   - Connect your GitHub repository
   - Create two services (frontend and backend)

2. **Configure Services**

   - Set build commands:
     - Frontend: `cd frontend && npm run build`
     - Backend: `cd backend && npm run build`
   - Set start commands:
     - Frontend: `cd frontend && npm run preview`
     - Backend: `cd backend && npm start`

3. **Add Environment Variables**
   - Add all required environment variables
   - Configure custom domains

### Option 3: Heroku

#### Backend Deployment

1. **Create Procfile**

```bash
# In backend directory
echo "web: npm start" > Procfile
```

2. **Deploy to Heroku**

```bash
cd backend
heroku create your-app-name
git push heroku main
```

#### Frontend Deployment

1. **Use Heroku Buildpack**

```bash
cd frontend
heroku create your-frontend-name --buildpack https://github.com/mars/create-react-app-buildpack.git
git push heroku main
```

### Option 4: Docker Deployment

#### Create Dockerfiles

**Backend Dockerfile**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

**Frontend Dockerfile**

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Docker Compose**

```yaml
version: "3.8"

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    env_file:
      - ./backend/.env

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - VITE_BACKEND_HOST=backend
      - VITE_BACKEND_PORT=3001
```

## Domain Configuration

### 1. Custom Domain Setup

1. **Purchase Domain**

   - Buy a domain from your preferred registrar
   - Configure DNS settings

2. **SSL Certificate**

   - Most hosting platforms provide free SSL
   - Configure automatic certificate renewal

3. **DNS Configuration**
   - Point your domain to your hosting provider
   - Configure subdomains if needed

### 2. Environment Variable Updates

Update your environment variables with production domains:

```env
# Backend
FRONTEND_URL=https://your-domain.com
BACKEND_HOST=api.your-domain.com

# Frontend
VITE_BACKEND_HOST=api.your-domain.com
```

## Monitoring & Maintenance

### 1. Health Checks

Set up monitoring for:

- Backend API health (`/health` endpoint)
- Database connectivity
- WebSocket connections
- Kana Labs API status

### 2. Logging

Configure logging for:

- Application errors
- Trade execution logs
- User activity
- Performance metrics

### 3. Backup Strategy

- Database backups (Supabase handles this automatically)
- Environment variable backups
- Code repository backups
- Configuration backups

## Security Considerations

### 1. Environment Variables

- Never commit `.env` files to version control
- Use secure secret management
- Rotate API keys regularly
- Use different keys for different environments

### 2. Database Security

- Enable RLS (Row Level Security)
- Use strong authentication
- Regular security audits
- Monitor for suspicious activity

### 3. API Security

- Implement rate limiting
- Use HTTPS everywhere
- Validate all inputs
- Monitor API usage

## Performance Optimization

### 1. Frontend Optimization

- Enable gzip compression
- Use CDN for static assets
- Implement caching strategies
- Optimize bundle size

### 2. Backend Optimization

- Use connection pooling
- Implement caching
- Optimize database queries
- Monitor resource usage

### 3. Database Optimization

- Regular index maintenance
- Query optimization
- Connection pooling
- Monitor slow queries

## Troubleshooting

### Common Issues

1. **WebSocket Connection Issues**

   - Check firewall settings
   - Verify WebSocket URL
   - Monitor connection logs

2. **Database Connection Issues**

   - Verify connection string
   - Check network connectivity
   - Monitor connection pool

3. **API Rate Limiting**
   - Implement exponential backoff
   - Monitor API usage
   - Consider API key rotation

### Debug Commands

```bash
# Check backend health
curl https://your-backend-domain.com/health

# Check frontend build
cd frontend && npm run build

# Check backend build
cd backend && npm run build

# Test database connection
cd backend && npm run test:db
```

## Post-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database schema created
- [ ] SSL certificates active
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Security measures implemented
- [ ] Performance optimization applied
- [ ] Documentation updated
- [ ] Team access configured

## Support

For deployment issues:

- Check the troubleshooting section
- Review application logs
- Contact the development team
- Refer to platform-specific documentation

---

**Note**: This deployment guide assumes you have basic knowledge of web development, cloud platforms, and database management. For complex deployments, consider consulting with DevOps professionals.
